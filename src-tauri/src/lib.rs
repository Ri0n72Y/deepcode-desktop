mod commands;
mod deepcode_runtime;
mod deepcode_static;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(deepcode_runtime::SharedRuntimeState::default())
        .invoke_handler(tauri::generate_handler![
            commands::start_deepcode_server,
            commands::stop_deepcode_server,
            commands::runtime_status,
            commands::deepcode_request,
            deepcode_static::read_deepcode_history,
            deepcode_static::read_deepcode_session,
            deepcode_static::read_deepcode_settings,
            deepcode_static::read_deepcode_skills,
        ])
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
