use tauri::{
    menu::{MenuBuilder, SubmenuBuilder},
    AppHandle, Emitter,
};

/// Build the native application menu bar
pub fn build_menu(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // --- App submenu (required as first item on macOS) ---
    let app_submenu = SubmenuBuilder::new(app, "mdView")
        .about(None)
        .separator()
        .text("settings", "Settings...")
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()?;

    // --- File menu ---
    let file_submenu = SubmenuBuilder::new(app, "File")
        .text("new_file", "New File\t⌘N")
        .text("open_file", "Open File...\t⌘O")
        .separator()
        .text("save", "Save\t⌘S")
        .text("save_as", "Save As...\t⇧⌘S")
        .separator()
        .text("export_html", "Export as HTML...")
        .separator()
        .text("close_tab", "Close Tab\t⌘W")
        .build()?;

    // --- Edit menu ---
    let edit_submenu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .separator()
        .text("find", "Find...\t⌘F")
        .text("find_replace", "Find and Replace...\t⌥⌘F")
        .build()?;

    // --- View menu ---
    let view_submenu = SubmenuBuilder::new(app, "View")
        .text("toggle_sidebar", "Toggle Sidebar\t⌘B")
        .text("toggle_outline", "Toggle Outline\t⌘/")
        .text("toggle_focus", "Focus Mode\t⇧⌘F")
        .separator()
        .text("zoom_in", "Zoom In\t⌘=")
        .text("zoom_out", "Zoom Out\t⌘-")
        .text("zoom_reset", "Actual Size\t⌘0")
        .separator()
        .text("toggle_theme", "Toggle Theme")
        .build()?;

    // --- Format menu ---
    let format_submenu = SubmenuBuilder::new(app, "Format")
        .text("bold", "Bold\t⇧⌘B")
        .text("italic", "Italic\t⌘I")
        .text("inline_code", "Inline Code\t⌘E")
        .separator()
        .text("heading_1", "Heading 1\t⇧⌘1")
        .text("heading_2", "Heading 2\t⇧⌘2")
        .text("heading_3", "Heading 3\t⇧⌘3")
        .text("heading_4", "Heading 4\t⇧⌘4")
        .text("heading_5", "Heading 5\t⇧⌘5")
        .text("heading_6", "Heading 6\t⇧⌘6")
        .separator()
        .text("insert_table", "Insert Table\t⌘T")
        .text("insert_code_block", "Code Block\t⇧⌘K")
        .text("insert_blockquote", "Blockquote\t⇧⌘Q")
        .text("insert_hr", "Horizontal Rule\t⇧⌘H")
        .text("insert_task_list", "Task List\t⇧⌘X")
        .build()?;

    // --- Window menu ---
    let window_submenu = SubmenuBuilder::new(app, "Window")
        .minimize()
        .separator()
        .close_window()
        .build()?;

    // --- Assemble menu ---
    let menu = MenuBuilder::new(app)
        .item(&app_submenu)
        .item(&file_submenu)
        .item(&edit_submenu)
        .item(&view_submenu)
        .item(&format_submenu)
        .item(&window_submenu)
        .build()?;

    app.set_menu(menu)?;
    Ok(())
}

/// Handle native menu events and emit them to the frontend
pub fn handle_menu_event(app: &AppHandle, event: tauri::menu::MenuEvent) {
    let action = event.id().0.as_str();
    // Emit a generic "menu-action" event that the frontend listens for
    let _ = app.emit("menu-action", action);
}
