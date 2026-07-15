mod commands;
mod menu;

use commands::{file, export};
use tauri::Manager;

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

            // Set transparent overlay titlebar on macOS to preserve native traffic lights
            #[cfg(target_os = "macos")]
            {
                use tauri::TitleBarStyle;
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_title_bar_style(TitleBarStyle::Overlay);
                }
            }

            Ok(())
        })
        .on_menu_event(|app, event| {
            menu::handle_menu_event(app, event);
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
