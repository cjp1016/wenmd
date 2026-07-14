use std::fs;

/// Export markdown content as a standalone HTML file
#[tauri::command]
pub fn export_html(content: String, path: String) -> Result<(), String> {
    let html = format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Exported Markdown</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; color: #333; }}
  h1, h2, h3, h4, h5, h6 {{ margin-top: 24px; margin-bottom: 16px; font-weight: 600; }}
  h1 {{ font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 8px; }}
  h2 {{ font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 8px; }}
  code {{ font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace; background: #f6f8fa; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }}
  pre {{ background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }}
  pre code {{ background: none; padding: 0; }}
  blockquote {{ padding: 0 16px; color: #6a737d; border-left: 4px solid #dfe2e5; margin: 0 0 16px 0; }}
  table {{ border-collapse: collapse; margin: 16px 0; }}
  th, td {{ border: 1px solid #dfe2e5; padding: 6px 13px; }}
  th {{ background: #f6f8fa; font-weight: 600; }}
  img {{ max-width: 100%; }}
  a {{ color: #0366d6; text-decoration: none; }}
  a:hover {{ text-decoration: underline; }}
</style>
</head>
<body>
{}
</body>
</html>"#,
        content
    );

    fs::write(&path, html).map_err(|e| format!("Failed to export HTML: {}", e))
}
