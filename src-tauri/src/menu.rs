use tauri::{
    menu::{MenuBuilder, SubmenuBuilder},
    AppHandle, Emitter, Manager,
};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MenuLocale {
    En,
    Zh,
}

impl MenuLocale {
    fn from_str(s: &str) -> Self {
        if s.starts_with("zh") {
            MenuLocale::Zh
        } else {
            MenuLocale::En
        }
    }
}

struct Labels {
    app: &'static str,
    settings: &'static str,
    about: &'static str,
    hide_label: &'static str,
    hide_others_label: &'static str,
    show_all_label: &'static str,
    quit_label: &'static str,
    file: &'static str,
    new_file: &'static str,
    open_file: &'static str,
    save: &'static str,
    save_as: &'static str,
    export_html: &'static str,
    close_tab: &'static str,
    recent_files: &'static str,
    clear_recent: &'static str,
    edit: &'static str,
    undo: &'static str,
    redo: &'static str,
    cut: &'static str,
    copy: &'static str,
    paste: &'static str,
    select_all: &'static str,
    find: &'static str,
    find_replace: &'static str,
    view: &'static str,
    toggle_sidebar: &'static str,
    toggle_outline: &'static str,
    focus_mode: &'static str,
    zoom_in: &'static str,
    zoom_out: &'static str,
    actual_size: &'static str,
    toggle_theme: &'static str,
    format: &'static str,
    bold: &'static str,
    italic: &'static str,
    inline_code: &'static str,
    heading_1: &'static str,
    heading_2: &'static str,
    heading_3: &'static str,
    heading_4: &'static str,
    heading_5: &'static str,
    heading_6: &'static str,
    insert_table: &'static str,
    code_block: &'static str,
    blockquote: &'static str,
    horizontal_rule: &'static str,
    task_list: &'static str,
    window: &'static str,
}

fn labels(locale: MenuLocale) -> Labels {
    match locale {
        MenuLocale::Zh => Labels {
            app: "WenMd",
            settings: "设置...",
            about: "关于 WenMd",
            hide_label: "隐藏 WenMd",
            hide_others_label: "隐藏其他",
            show_all_label: "显示全部",
            quit_label: "退出",
            file: "文件",
            new_file: "新建文件",
            open_file: "打开文件...",
            save: "保存",
            save_as: "另存为...",
            export_html: "导出为 HTML...",
            close_tab: "关闭标签页",
            recent_files: "最近打开",
            clear_recent: "清除最近记录",
            edit: "编辑",
            undo: "撤销",
            redo: "重做",
            cut: "剪切",
            copy: "复制",
            paste: "粘贴",
            select_all: "全选",
            find: "查找...",
            find_replace: "查找和替换...",
            view: "视图",
            toggle_sidebar: "切换侧边栏",
            toggle_outline: "切换大纲",
            focus_mode: "专注模式",
            zoom_in: "放大",
            zoom_out: "缩小",
            actual_size: "实际大小",
            toggle_theme: "切换主题",
            format: "格式",
            bold: "加粗",
            italic: "斜体",
            inline_code: "行内代码",
            heading_1: "标题 1",
            heading_2: "标题 2",
            heading_3: "标题 3",
            heading_4: "标题 4",
            heading_5: "标题 5",
            heading_6: "标题 6",
            insert_table: "插入表格",
            code_block: "代码块",
            blockquote: "引用",
            horizontal_rule: "水平分隔线",
            task_list: "任务列表",
            window: "窗口",
        },
        MenuLocale::En => Labels {
            app: "WenMd",
            settings: "Settings...",
            about: "About WenMd",
            hide_label: "Hide WenMd",
            hide_others_label: "Hide Others",
            show_all_label: "Show All",
            quit_label: "Quit",
            file: "File",
            new_file: "New File",
            open_file: "Open File...",
            save: "Save",
            save_as: "Save As...",
            export_html: "Export as HTML...",
            close_tab: "Close Tab",
            recent_files: "Recent Files",
            clear_recent: "Clear Recent",
            edit: "Edit",
            undo: "Undo",
            redo: "Redo",
            cut: "Cut",
            copy: "Copy",
            paste: "Paste",
            select_all: "Select All",
            find: "Find...",
            find_replace: "Find and Replace...",
            view: "View",
            toggle_sidebar: "Toggle Sidebar",
            toggle_outline: "Toggle Outline",
            focus_mode: "Focus Mode",
            zoom_in: "Zoom In",
            zoom_out: "Zoom Out",
            actual_size: "Actual Size",
            toggle_theme: "Toggle Theme",
            format: "Format",
            bold: "Bold",
            italic: "Italic",
            inline_code: "Inline Code",
            heading_1: "Heading 1",
            heading_2: "Heading 2",
            heading_3: "Heading 3",
            heading_4: "Heading 4",
            heading_5: "Heading 5",
            heading_6: "Heading 6",
            insert_table: "Insert Table",
            code_block: "Code Block",
            blockquote: "Blockquote",
            horizontal_rule: "Horizontal Rule",
            task_list: "Task List",
            window: "Window",
        },
    }
}

/// Build the native application menu bar with the given locale and recent files.
pub fn build_menu(app: &AppHandle, locale: MenuLocale) -> Result<(), Box<dyn std::error::Error>> {
    let t = labels(locale);

    // Get recent files from app state
    let recent_files: Vec<String> = {
        let state = app.state::<super::AppState>();
        let guard = state.recent_files.lock().map_err(|e| e.to_string())?;
        guard.clone()
    };

    // Helper to format shortcut labels for the current platform.
    // On Windows/Linux we show "Ctrl+Shift+X"; on macOS we keep "⇧⌘X".
    #[cfg(target_os = "macos")]
    let fmt = |base: &str| base.to_string();
    #[cfg(not(target_os = "macos"))]
    let fmt = |base: &str| {
        base.replace("⌘", "Ctrl+")
            .replace("⇧", "Shift+")
            .replace("⌥", "Alt+")
    };

    // --- App submenu (required as first item on macOS) ---
    let app_submenu = SubmenuBuilder::new(app, t.app)
        .text("about", t.about)
        .separator()
        .text("settings", format!("{}\t{}", t.settings, fmt("⌘,")))
        .separator()
        .text("hide", t.hide_label)
        .text("hide_others", t.hide_others_label)
        .text("show_all", t.show_all_label)
        .separator()
        .text("quit", t.quit_label)
        .build()?;

    // --- File menu ---
    let mut file_builder = SubmenuBuilder::new(app, t.file)
        .text("new_file", format!("{}\t{}", t.new_file, fmt("⌘N")))
        .text("open_file", format!("{}\t{}", t.open_file, fmt("⌘O")))
        .separator()
        .text("save", format!("{}\t{}", t.save, fmt("⌘S")))
        .text("save_as", format!("{}\t{}", t.save_as, fmt("⇧⌘S")))
        .separator()
        .text("export_html", t.export_html)
        .separator()
        .text("close_tab", format!("{}\t{}", t.close_tab, fmt("⌘W")));

    // Add recent files section
    if !recent_files.is_empty() {
        file_builder = file_builder.separator();
        file_builder = file_builder.text("recent_files_header", t.recent_files);
        for (idx, path) in recent_files.iter().take(10).enumerate() {
            let file_name = std::path::Path::new(path)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or(path);
            let id = format!("open_recent_{}", idx);
            file_builder = file_builder.text(&id, file_name);
        }
        file_builder = file_builder.separator();
        file_builder = file_builder.text("clear_recent", t.clear_recent);
    }

    let file_submenu = file_builder.build()?;

    // --- Edit menu ---
    let edit_submenu = SubmenuBuilder::new(app, t.edit)
        .text("undo", format!("{}\t{}", t.undo, fmt("⌘Z")))
        .text("redo", format!("{}\t{}", t.redo, fmt("⇧⌘Z")))
        .separator()
        .text("cut", format!("{}\t{}", t.cut, fmt("⌘X")))
        .text("copy", format!("{}\t{}", t.copy, fmt("⌘C")))
        .text("paste", format!("{}\t{}", t.paste, fmt("⌘V")))
        .text("select_all", format!("{}\t{}", t.select_all, fmt("⌘A")))
        .separator()
        .text("find", format!("{}\t{}", t.find, fmt("⌘F")))
        .text("find_replace", format!("{}\t{}", t.find_replace, fmt("⌥⌘F")))
        .build()?;

    // --- View menu ---
    let view_submenu = SubmenuBuilder::new(app, t.view)
        .text("toggle_sidebar", format!("{}\t{}", t.toggle_sidebar, fmt("⇧⌘B")))
        .text("toggle_outline", format!("{}\t{}", t.toggle_outline, fmt("⌘/")))
        .text("toggle_focus", format!("{}\t{}", t.focus_mode, fmt("⇧⌘F")))
        .separator()
        .text("zoom_in", format!("{}\t{}", t.zoom_in, fmt("⌘=")))
        .text("zoom_out", format!("{}\t{}", t.zoom_out, fmt("⌘-")))
        .text("zoom_reset", format!("{}\t{}", t.actual_size, fmt("⌘0")))
        .separator()
        .text("toggle_theme", t.toggle_theme)
        .build()?;

    // --- Format menu ---
    let format_submenu = SubmenuBuilder::new(app, t.format)
        .text("bold", format!("{}\t{}", t.bold, fmt("⌘B")))
        .text("italic", format!("{}\t{}", t.italic, fmt("⌘I")))
        .text("inline_code", format!("{}\t{}", t.inline_code, fmt("⌘E")))
        .separator()
        .text("heading_1", format!("{}\t{}", t.heading_1, fmt("⇧⌘1")))
        .text("heading_2", format!("{}\t{}", t.heading_2, fmt("⇧⌘2")))
        .text("heading_3", format!("{}\t{}", t.heading_3, fmt("⇧⌘3")))
        .text("heading_4", format!("{}\t{}", t.heading_4, fmt("⇧⌘4")))
        .text("heading_5", format!("{}\t{}", t.heading_5, fmt("⇧⌘5")))
        .text("heading_6", format!("{}\t{}", t.heading_6, fmt("⇧⌘6")))
        .separator()
        .text("insert_table", format!("{}\t{}", t.insert_table, fmt("⌘T")))
        .text("insert_code_block", format!("{}\t{}", t.code_block, fmt("⇧⌘K")))
        .text("insert_blockquote", format!("{}\t{}", t.blockquote, fmt("⇧⌘Q")))
        .text("insert_hr", format!("{}\t{}", t.horizontal_rule, fmt("⇧⌘H")))
        .text("insert_task_list", format!("{}\t{}", t.task_list, fmt("⇧⌘X")))
        .build()?;

    // --- Window menu ---
    let window_submenu = SubmenuBuilder::new(app, t.window)
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

/// Detect system locale for initial menu language.
pub fn detect_system_locale() -> MenuLocale {
    if let Some(locale) = sys_locale::get_locale() {
        MenuLocale::from_str(&locale)
    } else {
        MenuLocale::En
    }
}

/// Handle native menu events and emit them to the frontend
pub fn handle_menu_event(app: &AppHandle, event: tauri::menu::MenuEvent) {
    let action = event.id().0.as_str();
    match action {
        "quit" => {
            app.exit(0);
        }
        "clear_recent" => {
            if let Some(state) = app.try_state::<super::AppState>() {
                let _ = state.recent_files.lock().map(|mut recent| recent.clear());
                let locale = state.menu_locale.lock().map_or(MenuLocale::En, |g| *g);
                let _ = build_menu(app, locale);
            }
            let _ = app.emit("menu-action", "clear_recent");
        }
        _ => {
            // Handle open_recent_N actions
            if let Some(idx_str) = action.strip_prefix("open_recent_") {
                if let Ok(idx) = idx_str.parse::<usize>() {
                    if let Some(state) = app.try_state::<super::AppState>() {
                        if let Ok(recent) = state.recent_files.lock() {
                            if let Some(path) = recent.get(idx).cloned() {
                                let _ = app.emit("open-recent-file", path);
                            }
                        }
                    }
                }
            } else {
                // Emit a generic "menu-action" event that the frontend listens for
                let _ = app.emit("menu-action", action);
            }
        }
    }
}
