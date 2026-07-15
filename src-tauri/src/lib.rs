mod commands;
mod menu;

use commands::{file, export};
use menu::{build_menu, detect_system_locale, handle_menu_event, MenuLocale};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

/// Shared state that keeps track of the currently active menu locale and any
/// file path passed via command-line arguments.
struct AppState {
    menu_locale: Mutex<MenuLocale>,
    initial_file: Mutex<Option<String>>,
}

/// Return the file path passed via CLI when the app was launched, if any.
/// The value is consumed by the first call so it is only opened once.
#[tauri::command]
fn get_initial_file(app: AppHandle) -> Result<Option<String>, String> {
    let state = app.state::<AppState>();
    let mut file = state.initial_file.lock().map_err(|e| e.to_string())?;
    Ok(file.take())
}

/// Rebuild the native menu bar with the requested locale.
#[tauri::command]
fn set_menu_locale(app: AppHandle, locale: String) -> Result<(), String> {
    let new_locale = if locale.starts_with("zh") {
        MenuLocale::Zh
    } else {
        MenuLocale::En
    };

    {
        let state = app.state::<AppState>();
        let mut current = state.menu_locale.lock().map_err(|e| e.to_string())?;
        *current = new_locale;
    }

    build_menu(&app, new_locale).map_err(|e| e.to_string())?;
    Ok(())
}

/// Emit a "file-open" event to the frontend with the given path.
fn emit_open_file(app: &AppHandle, path: String) {
    let _ = app.emit("file-open", path);
}

/// Check the command-line arguments for a file path to open.
/// This handles double-clicking a file associated with the app on Windows.
fn find_file_arg() -> Option<String> {
    let args: Vec<String> = std::env::args().collect();
    // args[0] is the executable itself; look for a file path in the remaining args.
    for arg in args.iter().skip(1) {
        let trimmed = arg.trim();
        if trimmed.is_empty() {
            continue;
        }
        // Skip flags/options.
        if trimmed.starts_with('-') {
            continue;
        }
        // Heuristic: accept paths that look like markdown/text files or directories.
        let lower = trimmed.to_lowercase();
        if lower.ends_with(".md")
            || lower.ends_with(".markdown")
            || lower.ends_with(".txt")
            || std::path::Path::new(trimmed).is_dir()
        {
            return Some(trimmed.to_string());
        }
    }
    None
}

fn check_cli_args(app: &AppHandle) {
    if let Some(path) = find_file_arg() {
        emit_open_file(app, path);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial_locale = detect_system_locale();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .manage(AppState {
            menu_locale: Mutex::new(initial_locale),
            initial_file: Mutex::new(find_file_arg()),
        })
        .invoke_handler(tauri::generate_handler![
            file::open_file,
            file::save_file,
            file::save_file_as,
            file::list_directory,
            file::save_image,
            file::rename_file,
            file::delete_file,
            file::is_directory,
            export::export_html,
            set_menu_locale,
            get_initial_file,
        ])
        .setup(move |app| {
            let handle = app.handle().clone();
            build_menu(&handle, initial_locale).expect("Failed to build menu");

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
            handle_menu_event(app, event);
        })
        .on_window_event(|window, event| {
            // When the window is focused, check if any new CLI args appeared.
            // This handles files opened while the app is already running on Windows.
            if let tauri::WindowEvent::Focused(true) = event {
                check_cli_args(&window.app_handle());
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
