use reqwest::blocking::Client;
use reqwest::Method;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashSet;
use std::env;
use std::io::{BufRead, BufReader};
use std::net::TcpListener;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::{mpsc, Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub type SharedRuntimeState = Arc<Mutex<DeepcodeRuntimeState>>;

#[derive(Default)]
pub struct DeepcodeRuntimeState {
    child: Option<Child>,
    status: RuntimeStatus,
    endpoint: Option<RuntimeEndpoint>,
}

#[derive(Debug, Clone)]
struct RuntimeEndpoint {
    base_url: String,
    token: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeStatus {
    pub status: RuntimeConnectionStatus,
    pub pid: Option<u32>,
    pub project_root: Option<String>,
    pub last_error: Option<String>,
}

impl Default for RuntimeStatus {
    fn default() -> Self {
        Self {
            status: RuntimeConnectionStatus::Offline,
            pid: None,
            project_root: None,
            last_error: None,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum RuntimeConnectionStatus {
    Offline,
    Starting,
    Connected,
    Error,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartRuntimeInput {
    pub project_root: Option<String>,
    pub binary_path: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeRequestInput {
    pub route: String,
    pub method: String,
    pub body: Option<Value>,
}

struct ServerCommandSpec {
    binary: String,
    args: Vec<String>,
    cwd: Option<PathBuf>,
}

pub fn start_runtime(
    app_handle: AppHandle,
    state: &mut DeepcodeRuntimeState,
    input: StartRuntimeInput,
) -> Result<RuntimeStatus, String> {
    if let Some(child) = state.child.as_mut() {
        match child.try_wait().map_err(|error| error.to_string())? {
            Some(_) => {
                state.child = None;
                state.endpoint = None;
            }
            None => return Ok(state.status.clone()),
        }
    }

    let project_root = resolve_project_root(input.project_root)?;
    let port = choose_local_port()?;
    let ready_timeout = read_ready_timeout();
    let command_spec = resolve_server_command(input.binary_path, &project_root, port)?;

    state.status = RuntimeStatus {
        status: RuntimeConnectionStatus::Starting,
        pid: None,
        project_root: Some(project_root.clone()),
        last_error: None,
    };
    state.endpoint = None;

    let mut command = Command::new(&command_spec.binary);
    command.args(&command_spec.args);
    if let Some(cwd) = command_spec.cwd.as_ref() {
        command.current_dir(cwd);
    }
    command.stdout(Stdio::piped()).stderr(Stdio::piped());

    let mut child = command.spawn().map_err(|error| {
        format!(
            "failed to start deepcode headless server via `{}`: {error}",
            command_spec.binary
        )
    })?;
    let pid = child.id();
    state.status.pid = Some(pid);

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "failed to capture deepcode headless server stdout".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "failed to capture deepcode headless server stderr".to_string())?;

    let (ready_sender, ready_receiver) = mpsc::channel::<RuntimeEndpoint>();
    spawn_stdout_reader(stdout, ready_sender);
    spawn_stderr_reader(stderr, app_handle.clone());

    match ready_receiver.recv_timeout(ready_timeout) {
        Ok(endpoint) => {
            let ready = check_ready(&endpoint);
            if let Err(error) = ready {
                let _ = child.kill();
                let _ = child.wait();
                state.child = None;
                state.endpoint = None;
                state.status = RuntimeStatus {
                    status: RuntimeConnectionStatus::Error,
                    pid: None,
                    project_root: Some(project_root),
                    last_error: Some(error),
                };
                return Ok(state.status.clone());
            }

            state.endpoint = Some(endpoint.clone());
            state.child = Some(child);
            state.status = RuntimeStatus {
                status: RuntimeConnectionStatus::Connected,
                pid: Some(pid),
                project_root: Some(project_root),
                last_error: None,
            };
            spawn_sse_bridge(app_handle, endpoint);
            Ok(state.status.clone())
        }
        Err(_) => {
            let _ = child.kill();
            let _ = child.wait();
            state.child = None;
            state.endpoint = None;
            state.status = RuntimeStatus {
                status: RuntimeConnectionStatus::Error,
                pid: None,
                project_root: Some(project_root),
                last_error: Some(format!(
                    "deepcode headless server did not become ready within {}ms",
                    ready_timeout.as_millis()
                )),
            };
            Ok(state.status.clone())
        }
    }
}

pub fn stop_runtime(state: &mut DeepcodeRuntimeState) -> Result<RuntimeStatus, String> {
    if let Some(mut child) = state.child.take() {
        let _ = child.kill();
        let _ = child.wait();
    }
    state.endpoint = None;
    state.status = RuntimeStatus::default();
    Ok(state.status.clone())
}

pub fn runtime_status(state: &mut DeepcodeRuntimeState) -> RuntimeStatus {
    if let Some(child) = state.child.as_mut() {
        match child.try_wait() {
            Ok(Some(_)) => {
                state.child = None;
                state.endpoint = None;
                state.status = RuntimeStatus::default();
            }
            Ok(None) => {}
            Err(error) => {
                state.status.status = RuntimeConnectionStatus::Error;
                state.status.last_error = Some(error.to_string());
            }
        }
    }
    state.status.clone()
}

pub fn proxy_request(state: &DeepcodeRuntimeState, input: RuntimeRequestInput) -> Result<Value, String> {
    ensure_allowed_route(&input.route)?;
    ensure_allowed_method(&input.method)?;

    if !matches!(state.status.status, RuntimeConnectionStatus::Connected) {
        return Ok(json!({
            "ok": false,
            "error": "deepcode server is not connected yet",
            "route": input.route,
            "method": input.method,
            "bodyAccepted": input.body.is_some()
        }));
    }

    let endpoint = match state.endpoint.clone() {
        Some(endpoint) => endpoint,
        None => {
            return Ok(json!({
                "ok": false,
                "error": "deepcode server endpoint is missing",
                "route": input.route,
                "method": input.method
            }));
        }
    };

    proxy_json_request(&endpoint, input)
}

fn resolve_project_root(project_root: Option<String>) -> Result<String, String> {
    match project_root {
        Some(value) if !value.trim().is_empty() => Ok(value),
        _ => env::current_dir()
            .map(|path| path.to_string_lossy().to_string())
            .map_err(|error| format!("failed to resolve current working directory: {error}")),
    }
}

fn choose_local_port() -> Result<u16, String> {
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|error| error.to_string())?;
    let port = listener.local_addr().map_err(|error| error.to_string())?.port();
    drop(listener);
    Ok(port)
}

fn read_ready_timeout() -> Duration {
    env::var("DEEPCODE_SERVER_READY_TIMEOUT_MS")
        .ok()
        .and_then(|value| value.parse::<u64>().ok())
        .map(Duration::from_millis)
        .unwrap_or_else(|| Duration::from_millis(30_000))
}

fn resolve_server_command(binary_path: Option<String>, project_root: &str, port: u16) -> Result<ServerCommandSpec, String> {
    let headless_path = env::var("DEEPCODE_HEADLESS_PATH").ok().filter(|value| !value.trim().is_empty());
    let explicit_binary = binary_path
        .or_else(|| env::var("DEEPCODE_SERVER_BINARY").ok())
        .filter(|value| !value.trim().is_empty());
    let explicit_args = env::var("DEEPCODE_SERVER_ARGS")
        .ok()
        .map(|value| split_args(&value))
        .unwrap_or_default();

    let mut spec = if let Some(binary) = explicit_binary {
        ServerCommandSpec {
            binary,
            args: explicit_args,
            cwd: headless_path.as_ref().map(PathBuf::from),
        }
    } else if let Some(path) = headless_path {
        let root = PathBuf::from(path);
        let server_js = root.join("packages").join("server").join("dist").join("server.js");
        if !server_js.exists() {
            return Err(format!(
                "DEEPCODE_HEADLESS_PATH is set but server entry was not found at {}; build @vegamo/deepcode-server or set DEEPCODE_SERVER_BINARY",
                server_js.display()
            ));
        }
        ServerCommandSpec {
            binary: "node".to_string(),
            args: vec![server_js.to_string_lossy().to_string()],
            cwd: Some(root),
        }
    } else {
        ServerCommandSpec {
            binary: "deepcode-server".to_string(),
            args: explicit_args,
            cwd: None,
        }
    };

    spec.args.extend([
        "--port".to_string(),
        port.to_string(),
        "--project-root".to_string(),
        project_root.to_string(),
    ]);
    Ok(spec)
}

fn split_args(value: &str) -> Vec<String> {
    value
        .split_whitespace()
        .filter(|part| !part.trim().is_empty())
        .map(ToString::to_string)
        .collect()
}

fn spawn_stdout_reader(stdout: impl std::io::Read + Send + 'static, ready_sender: mpsc::Sender<RuntimeEndpoint>) {
    thread::spawn(move || {
        let mut ready_sender = Some(ready_sender);
        let reader = BufReader::new(stdout);
        for line in reader.lines().map_while(Result::ok) {
            if let Some(sender) = ready_sender.take() {
                if let Some(endpoint) = parse_listening_line(&line) {
                    let _ = sender.send(endpoint);
                } else {
                    ready_sender = Some(sender);
                }
            }
        }
    });
}

fn spawn_stderr_reader(stderr: impl std::io::Read + Send + 'static, app_handle: AppHandle) {
    thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines().map_while(Result::ok) {
            let sanitized = sanitize_server_log(&line);
            let _ = app_handle.emit(
                "deepcode-runtime-event",
                json!({
                    "type": "error",
                    "error": sanitized,
                }),
            );
        }
    });
}

fn parse_listening_line(line: &str) -> Option<RuntimeEndpoint> {
    if !line.contains("deepcode server listening on") {
        return None;
    }
    let base_url = line
        .split_whitespace()
        .find(|part| part.starts_with("http://") || part.starts_with("https://"))?
        .trim_end_matches(',')
        .to_string();
    let token = line
        .split(" token=")
        .nth(1)
        .map(|value| value.split_whitespace().next().unwrap_or_default().to_string())
        .filter(|value| !value.is_empty());
    Some(RuntimeEndpoint { base_url, token })
}

fn sanitize_server_log(line: &str) -> String {
    if let Some((prefix, _)) = line.split_once(" token=") {
        format!("{prefix} token=<redacted>")
    } else {
        line.to_string()
    }
}

fn check_ready(endpoint: &RuntimeEndpoint) -> Result<(), String> {
    let client = Client::new();
    let url = format!("{}/ready", endpoint.base_url.trim_end_matches('/'));
    let response = add_auth(client.post(url), endpoint)
        .send()
        .map_err(|error| format!("deepcode headless /ready request failed: {error}"))?;
    if response.status().is_success() {
        Ok(())
    } else {
        Err(format!("deepcode headless /ready returned {}", response.status()))
    }
}

fn proxy_json_request(endpoint: &RuntimeEndpoint, input: RuntimeRequestInput) -> Result<Value, String> {
    let client = Client::new();
    let method = input.method.parse::<Method>().map_err(|error| error.to_string())?;
    let url = format!("{}{}", endpoint.base_url.trim_end_matches('/'), input.route);
    let mut request = add_auth(client.request(method.clone(), url), endpoint);
    if method != Method::GET {
        request = request.json(&input.body.unwrap_or_else(|| json!({})));
    }

    let response = request.send().map_err(|error| error.to_string())?;
    let status = response.status();
    let text = response.text().map_err(|error| error.to_string())?;
    let parsed = serde_json::from_str::<Value>(&text).unwrap_or_else(|_| json!({ "ok": false, "error": text }));

    if status.is_success() {
        Ok(parsed)
    } else {
        Ok(json!({
            "ok": false,
            "error": parsed.get("error").and_then(Value::as_str).unwrap_or("deepcode request failed"),
            "statusCode": status.as_u16(),
            "route": input.route,
            "method": input.method
        }))
    }
}

fn spawn_sse_bridge(app_handle: AppHandle, endpoint: RuntimeEndpoint) {
    thread::spawn(move || {
        let client = Client::new();
        let url = format!("{}/events", endpoint.base_url.trim_end_matches('/'));
        let response = match add_auth(client.get(url), &endpoint).send() {
            Ok(response) => response,
            Err(error) => {
                let _ = app_handle.emit(
                    "deepcode-runtime-event",
                    json!({ "type": "error", "error": format!("SSE connection failed: {error}") }),
                );
                return;
            }
        };

        let mut reader = BufReader::new(response);
        let mut data = String::new();
        loop {
            let mut line = String::new();
            match reader.read_line(&mut line) {
                Ok(0) => break,
                Ok(_) => {
                    let trimmed = line.trim_end_matches(['\r', '\n']);
                    if let Some(value) = trimmed.strip_prefix("data:") {
                        data.push_str(value.trim());
                    } else if trimmed.is_empty() && !data.is_empty() {
                        if let Ok(event) = serde_json::from_str::<Value>(&data) {
                            let _ = app_handle.emit("deepcode-runtime-event", event);
                        }
                        data.clear();
                    }
                }
                Err(error) => {
                    let _ = app_handle.emit(
                        "deepcode-runtime-event",
                        json!({ "type": "error", "error": format!("SSE read failed: {error}") }),
                    );
                    break;
                }
            }
        }
    });
}

fn add_auth(builder: reqwest::blocking::RequestBuilder, endpoint: &RuntimeEndpoint) -> reqwest::blocking::RequestBuilder {
    match endpoint.token.as_ref() {
        Some(token) => builder.header("x-deepcode-token", token),
        None => builder,
    }
}

fn ensure_allowed_route(route: &str) -> Result<(), String> {
    let allowed: HashSet<&str> = [
        "/ready",
        "/health",
        "/version",
        "/commands",
        "/prompt",
        "/interrupt",
        "/request-skills",
        "/back-to-list",
        "/select-session",
        "/open-file",
        "/openFile",
        "/model",
        "/processes",
        "/processes/timeout",
        "/sessions",
        "/sessions/rename",
        "/sessions/delete",
        "/permissions/pending",
        "/permissions/reply",
        "/undo/restore",
        "/undo/restore-code",
        "/undo/restore-conversation",
        "/exit",
    ]
    .into_iter()
    .collect();

    if allowed.contains(route) {
        Ok(())
    } else {
        Err(format!("route is not allowlisted: {route}"))
    }
}

fn ensure_allowed_method(method: &str) -> Result<(), String> {
    match method {
        "GET" | "POST" => Ok(()),
        _ => Err(format!("method is not allowlisted: {method}")),
    }
}

#[cfg(test)]
mod tests {
    use super::{ensure_allowed_method, ensure_allowed_route, parse_listening_line};

    #[test]
    fn parses_listening_line_without_exposing_token_in_status() {
        let endpoint = parse_listening_line("deepcode server listening on http://127.0.0.1:8787 token=secret")
            .expect("endpoint");
        assert_eq!(endpoint.base_url, "http://127.0.0.1:8787");
        assert_eq!(endpoint.token.as_deref(), Some("secret"));
    }

    #[test]
    fn validates_proxy_boundaries() {
        assert!(ensure_allowed_route("/ready").is_ok());
        assert!(ensure_allowed_route("https://example.com/ready").is_err());
        assert!(ensure_allowed_method("GET").is_ok());
        assert!(ensure_allowed_method("DELETE").is_err());
    }
}
