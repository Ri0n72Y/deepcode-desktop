use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashSet;
use std::process::Child;
use std::sync::Mutex;

pub type SharedRuntimeState = Mutex<DeepcodeRuntimeState>;

#[derive(Default)]
pub struct DeepcodeRuntimeState {
    child: Option<Child>,
    status: RuntimeStatus,
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

#[derive(Debug, Clone, Serialize)]
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

pub fn start_runtime(state: &mut DeepcodeRuntimeState, input: StartRuntimeInput) -> Result<RuntimeStatus, String> {
    if let Some(child) = state.child.as_mut() {
        match child.try_wait().map_err(|error| error.to_string())? {
            Some(_) => state.child = None,
            None => return Ok(state.status.clone()),
        }
    }

    state.status = RuntimeStatus {
        status: RuntimeConnectionStatus::Starting,
        pid: None,
        project_root: input.project_root,
        last_error: Some(format!(
            "host-owned server startup is not wired yet; binary_path={}",
            input.binary_path.unwrap_or_else(|| "deepcode".to_string())
        )),
    };

    Ok(state.status.clone())
}

pub fn stop_runtime(state: &mut DeepcodeRuntimeState) -> Result<RuntimeStatus, String> {
    if let Some(mut child) = state.child.take() {
        let _ = child.kill();
        let _ = child.wait();
    }
    state.status = RuntimeStatus::default();
    Ok(state.status.clone())
}

pub fn runtime_status(state: &mut DeepcodeRuntimeState) -> RuntimeStatus {
    if let Some(child) = state.child.as_mut() {
        match child.try_wait() {
            Ok(Some(_)) => {
                state.child = None;
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

    Err("host-owned HTTP proxy is not wired yet".to_string())
}

fn ensure_allowed_route(route: &str) -> Result<(), String> {
    let allowed: HashSet<&str> = [
        "/ready",
        "/prompt",
        "/interrupt",
        "/request-skills",
        "/back-to-list",
        "/select-session",
        "/open-file",
        "/model",
        "/processes",
        "/processes/timeout",
        "/permissions/pending",
        "/permissions/reply",
        "/undo/restore",
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
