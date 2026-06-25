mod commands;
mod deepcode_runtime;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(deepcode_runtime::SharedRuntimeState::default())
        .invoke_handler(tauri::generate_handler![
            commands::start_deepcode_server,
            commands::stop_deepcode_server,
            commands::runtime_status,
            commands::deepcode_request,
        ])
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
