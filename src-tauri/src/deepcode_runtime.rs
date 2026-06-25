use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::Mutex;

#[derive(Default)]
pub struct DeepcodeRuntimeState {
    inner: Mutex<RuntimeSnapshot>,
}

#[derive(Default)]
struct RuntimeSnapshot {
    project_root: Option<String>,
    binary_path: Option<String>,
    pid: Option<u32>,
    status: RuntimeConnectionStatus,
    last_error: Option<String>,
}

#[derive(Clone, Copy, Default, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeConnectionStatus {
    #[default]
    Offline,
    Starting,
    Connected,
    Error,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeStatus {
    status: RuntimeConnectionStatus,
    project_root: Option<String>,
    pid: Option<u32>,
    last_error: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeepcodeRequest {
    route: String,
    method: String,
    body: Option<Value>,
}

#[tauri::command]
pub fn runtime_status(state: tauri::State<'_, DeepcodeRuntimeState>) -> Result<RuntimeStatus, String> {
    let snapshot = state.inner.lock().map_err(|_| "runtime state is poisoned".to_string())?;
    Ok(snapshot.to_status())
}

#[tauri::command]
pub fn start_deepcode_server(
    project_root: Option<String>,
    binary_path: Option<String>,
    state: tauri::State<'_, DeepcodeRuntimeState>,
) -> Result<RuntimeStatus, String> {
    let mut snapshot = state.inner.lock().map_err(|_| "runtime state is poisoned".to_string())?;
    snapshot.project_root = project_root;
    snapshot.binary_path = binary_path;
    snapshot.status = RuntimeConnectionStatus::Offline;
    snapshot.last_error = Some("host-owned server startup is not wired in this PR".to_string());
    Ok(snapshot.to_status())
}

#[tauri::command]
pub fn stop_deepcode_server(state: tauri::State<'_, DeepcodeRuntimeState>) -> Result<RuntimeStatus, String> {
    let mut snapshot = state.inner.lock().map_err(|_| "runtime state is poisoned".to_string())?;
    snapshot.pid = None;
    snapshot.status = RuntimeConnectionStatus::Offline;
    snapshot.last_error = None;
    Ok(snapshot.to_status())
}

#[tauri::command]
pub fn deepcode_request(request: DeepcodeRequest, state: tauri::State<'_, DeepcodeRuntimeState>) -> Result<Value, String> {
    validate_route(&request.route)?;
    validate_method(&request.method)?;
    let snapshot = state.inner.lock().map_err(|_| "runtime state is poisoned".to_string())?;
    if !matches!(snapshot.status, RuntimeConnectionStatus::Connected) {
        return Err("deepcode server is not connected".to_string());
    }
    let _body = request.body;
    Ok(json!({ "ok": false, "error": "host proxy is not wired in this PR" }))
}

fn validate_route(route: &str) -> Result<(), String> {
    const ALLOWED_ROUTES: &[&str] = &[
        "/ready",
        "/request-skills",
        "/back-to-list",
        "/prompt",
        "/interrupt",
        "/sessions",
        "/select-session",
        "/open-file",
        "/model",
        "/processes",
        "/processes/timeout",
        "/permissions/pending",
        "/permissions/reply",
        "/undo/restore",
        "/exit",
    ];
    if ALLOWED_ROUTES.contains(&route) {
        Ok(())
    } else {
        Err(format!("route is not allowed: {route}"))
    }
}

fn validate_method(method: &str) -> Result<(), String> {
    match method {
        "GET" | "POST" => Ok(()),
        _ => Err(format!("method is not allowed: {method}")),
    }
}

impl RuntimeSnapshot {
    fn to_status(&self) -> RuntimeStatus {
        RuntimeStatus {
            status: self.status,
            project_root: self.project_root.clone(),
            pid: self.pid,
            last_error: self.last_error.clone(),
        }
    }
}
