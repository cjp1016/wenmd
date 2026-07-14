mod commands;

use commands::{file, export};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            file::open_file,
            file::save_file,
            file::save_file_as,
            file::list_directory,
            file::save_image,
            export::export_html,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
