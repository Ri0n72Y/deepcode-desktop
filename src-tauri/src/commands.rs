use crate::deepcode_runtime::{self, RuntimeRequestInput, RuntimeStatus, SharedRuntimeState, StartRuntimeInput};
use serde_json::Value;
use tauri::{AppHandle, State};

#[tauri::command]
pub fn start_deepcode_server(
    project_root: Option<String>,
    binary_path: Option<String>,
    app_handle: AppHandle,
    state: State<'_, SharedRuntimeState>,
) -> Result<RuntimeStatus, String> {
    let mut guard = state.lock().map_err(|error| error.to_string())?;
    deepcode_runtime::start_runtime(&app_handle, &mut guard, StartRuntimeInput { project_root, binary_path })
}

#[tauri::command]
pub fn stop_deepcode_server(state: State<'_, SharedRuntimeState>) -> Result<RuntimeStatus, String> {
    let mut guard = state.lock().map_err(|error| error.to_string())?;
    deepcode_runtime::stop_runtime(&mut guard)
}

#[tauri::command]
pub fn runtime_status(state: State<'_, SharedRuntimeState>) -> Result<RuntimeStatus, String> {
    let mut guard = state.lock().map_err(|error| error.to_string())?;
    Ok(deepcode_runtime::runtime_status(&mut guard))
}

#[tauri::command]
pub fn deepcode_request(
    route: String,
    method: String,
    body: Option<Value>,
    state: State<'_, SharedRuntimeState>,
) -> Result<Value, String> {
    let guard = state.lock().map_err(|error| error.to_string())?;
    deepcode_runtime::proxy_request(&guard, RuntimeRequestInput { route, method, body })
}
