mod deepcode_runtime;

use deepcode_runtime::{deepcode_request, runtime_status, start_deepcode_server, stop_deepcode_server, DeepcodeRuntimeState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(DeepcodeRuntimeState::default())
        .invoke_handler(tauri::generate_handler![
            runtime_status,
            start_deepcode_server,
            stop_deepcode_server,
            deepcode_request,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
