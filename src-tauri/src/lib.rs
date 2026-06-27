mod deepcode_static;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            deepcode_static::read_deepcode_history,
            deepcode_static::read_deepcode_session,
            deepcode_static::read_deepcode_settings,
            deepcode_static::read_deepcode_skills,
        ])
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
