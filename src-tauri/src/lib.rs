mod commands;
mod menu;

use commands::{file, export};
use menu::{build_menu, detect_system_locale, handle_menu_event, MenuLocale};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

/// Shared state that keeps track of the currently active menu locale,
/// any file path passed via command-line arguments, and recent files.
struct AppState {
    menu_locale: Mutex<MenuLocale>,
    initial_file: Mutex<Option<String>>,
    recent_files: Mutex<Vec<String>>,
    /// When true, the next CloseRequested event will be allowed to proceed
    /// (used after the frontend has confirmed the close).
    force_close: Mutex<bool>,
}

/// Return the file path passed via CLI when the app was launched, if any.
/// The value is consumed by the first call so it is only opened once.
#[tauri::command]
fn get_initial_file(app: AppHandle) -> Result<Option<String>, String> {
    let state = app.state::<AppState>();
    let initial = state.initial_file.lock().map_err(|e| e.to_string())?;
    Ok(initial.clone())
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

/// Update the recent files list in the native menu bar.
#[tauri::command]
fn update_recent_files(app: AppHandle, files: Vec<String>) -> Result<(), String> {
    {
        let state = app.state::<AppState>();
        let mut recent = state.recent_files.lock().map_err(|e| e.to_string())?;
        *recent = files;
    }

    let locale = {
        let state = app.state::<AppState>();
        let guard = state.menu_locale.lock().map_err(|e| e.to_string())?;
        *guard
    };

    build_menu(&app, locale).map_err(|e| e.to_string())?;
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

/// Set the force_close flag and close the main window.
/// Called from the frontend after the user has confirmed the close
/// (either saved or chose to discard changes).
#[tauri::command]
fn confirm_close(app: AppHandle) -> Result<(), String> {
    {
        let state = app.state::<AppState>();
        let mut force = state.force_close.lock().map_err(|e| e.to_string())?;
        *force = true;
    }
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.close();
    }
    Ok(())
}

/// Exit the application immediately.
/// Called from the frontend after the user has confirmed quit
/// (either saved or chose to discard changes).
#[tauri::command]
fn quit_app(app: AppHandle) -> Result<(), String> {
    app.exit(0);
    Ok(())
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
            recent_files: Mutex::new(Vec::new()),
            force_close: Mutex::new(false),
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
            update_recent_files,
            confirm_close,
            quit_app,
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
            match event {
                // When the window is focused, check if any new CLI args appeared.
                // This handles files opened while the app is already running on Windows.
                tauri::WindowEvent::Focused(true) => {
                    check_cli_args(&window.app_handle());
                }
                // Intercept close requests (red X, Cmd+W, Window > Close).
                // Always prevent the close at the OS level and delegate to the frontend,
                // unless the force_close flag has been set by the confirm_close command.
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    let state = window.app_handle().state::<AppState>();
                    let should_close = state
                        .force_close
                        .lock()
                        .map(|v| *v)
                        .unwrap_or(false);
                    if should_close {
                        // User has already confirmed – allow the close to proceed.
                        return;
                    }
                    // Prevent the default close and ask the frontend to decide.
                    api.prevent_close();
                    let _ = window.emit("close-requested", ());
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
