use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileEntry>>,
}

/// Read a text file and return its contents
#[tauri::command]
pub fn open_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}

/// Check whether a path is an existing directory.
#[tauri::command]
pub fn is_directory(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).is_dir())
}

/// Save content to a file at the given path
#[tauri::command]
pub fn save_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| format!("Failed to save file: {}", e))
}

/// Save content to a new file (save as), returns the chosen path
#[tauri::command]
pub async fn save_file_as(
    app: tauri::AppHandle,
    content: String,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let (sender, receiver) = std::sync::mpsc::channel();
    app.dialog()
        .file()
        .add_filter("Markdown", &["md", "markdown", "txt"])
        .save_file(move |file_path| {
            let _ = sender.send(file_path);
        });

    let result = receiver.recv().map_err(|e| format!("Dialog error: {}", e))?;

    if let Some(path) = result {
        let path_str = path.to_string();
        fs::write(&path_str, &content).map_err(|e| format!("Failed to save file: {}", e))?;
        Ok(Some(path_str))
    } else {
        Ok(None)
    }
}

/// List directory contents recursively (one level deep for the tree)
#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let path = Path::new(&path);
    if !path.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    let mut entries: Vec<FileEntry> = Vec::new();

    let read_dir = fs::read_dir(path).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in read_dir {
        if let Ok(entry) = entry {
            let entry_path = entry.path();
            let name = entry_path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string();

            // Skip hidden files and common ignore directories
            if name.starts_with('.') || name == "node_modules" || name == "target" {
                continue;
            }

            let is_dir = entry_path.is_dir();
            let path_str = entry_path.to_string_lossy().to_string();

            // For markdown files and directories, include them
            let is_md = name.ends_with(".md")
                || name.ends_with(".markdown")
                || name.ends_with(".txt");

            if is_dir || is_md {
                entries.push(FileEntry {
                    name,
                    path: path_str,
                    is_dir,
                    children: None,
                });
            }
        }
    }

    // Sort: directories first, then alphabetically
    entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(entries)
}

/// Save an image file (base64 encoded data) and return the saved path
#[tauri::command]
pub fn save_image(path: String, data: Vec<u8>) -> Result<String, String> {
    // Ensure parent directory exists
    if let Some(parent) = Path::new(&path).parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
        }
    }
    fs::write(&path, &data).map_err(|e| format!("Failed to save image: {}", e))?;
    Ok(path)
}

/// Rename a file (move to new path within same directory)
#[tauri::command]
pub fn rename_file(old_path: String, new_name: String) -> Result<String, String> {
    let old = Path::new(&old_path);
    if !old.exists() {
        return Err("File does not exist".to_string());
    }
    let parent = old.parent().ok_or("Invalid path")?;
    let new_path = parent.join(&new_name);
    let new_path_str = new_path.to_string_lossy().to_string();
    fs::rename(&old_path, &new_path_str).map_err(|e| format!("Failed to rename file: {}", e))?;
    Ok(new_path_str)
}

/// Delete a file permanently
#[tauri::command]
pub fn delete_file(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err("File does not exist".to_string());
    }
    if p.is_dir() {
        fs::remove_dir_all(&path).map_err(|e| format!("Failed to delete directory: {}", e))?;
    } else {
        fs::remove_file(&path).map_err(|e| format!("Failed to delete file: {}", e))?;
    }
    Ok(())
}
