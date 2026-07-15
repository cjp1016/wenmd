mod commands;
mod menu;

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
            file::rename_file,
            file::delete_file,
            export::export_html,
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            menu::build_menu(&handle).expect("Failed to build menu");
            Ok(())
        })
        .on_menu_event(|app, event| {
            menu::handle_menu_event(app, event);
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
