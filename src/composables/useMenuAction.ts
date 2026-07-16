import { onMounted, onUnmounted } from 'vue';
import { listen } from '@tauri-apps/api/event';
import { useFileStore } from '../stores/fileStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useEditorStore } from '../stores/editorStore';
import { INSERT_TEXT_EVENT, INSERT_WRAP_EVENT } from './useShortcut';

export function useMenuAction() {
  const fileStore = useFileStore();
  const settingsStore = useSettingsStore();
  const editorStore = useEditorStore();

  function dispatchInsertText(text: string) {
    window.dispatchEvent(new CustomEvent(INSERT_TEXT_EVENT, { detail: text }));
  }

  function dispatchInsertWrap(prefix: string, suffix: string) {
    window.dispatchEvent(new CustomEvent(INSERT_WRAP_EVENT, { detail: { prefix, suffix } }));
  }

  async function handleMenuAction(action: string) {
    switch (action) {
      // File
      case 'new_file':
        fileStore.newFile();
        break;
      case 'open_file':
        await fileStore.openFile();
        break;
      case 'save':
        await fileStore.saveFile(false);
        break;
      case 'save_as':
        await fileStore.saveFile(true);
        break;
      case 'export_html':
        await fileStore.exportHtml();
        break;
      case 'close_tab':
        if (fileStore.activeTabId) fileStore.closeTab(fileStore.activeTabId);
        break;

      // View
      case 'toggle_sidebar':
        settingsStore.toggleSidebar();
        break;
      case 'toggle_outline':
        editorStore.toggleSourceMode();
        break;
      case 'toggle_focus':
        editorStore.toggleFocusMode();
        break;
      case 'zoom_in':
        settingsStore.setFontSize(Math.min(settingsStore.settings.fontSize + 1, 28));
        break;
      case 'zoom_out':
        settingsStore.setFontSize(Math.max(settingsStore.settings.fontSize - 1, 12));
        break;
      case 'zoom_reset':
        settingsStore.setFontSize(16);
        break;
      case 'toggle_theme':
        settingsStore.setTheme(settingsStore.settings.theme === 'dark' ? 'light' : 'dark');
        break;

      // Edit
      case 'undo':
        document.execCommand('undo');
        break;
      case 'redo':
        document.execCommand('redo');
        break;
      case 'cut':
        document.execCommand('cut');
        break;
      case 'copy':
        document.execCommand('copy');
        break;
      case 'paste':
        try {
          const text = await navigator.clipboard.readText();
          dispatchInsertText(text);
        } catch {
          document.execCommand('paste');
        }
        break;
      case 'select_all':
        document.execCommand('selectAll');
        break;
      case 'find':
        editorStore.showFindReplace = true;
        break;
      case 'find_replace':
        editorStore.showFindReplace = true;
        break;

      // Format
      case 'bold':
        dispatchInsertWrap('**', '**');
        break;
      case 'italic':
        dispatchInsertWrap('*', '*');
        break;
      case 'inline_code':
        dispatchInsertWrap('`', '`');
        break;
      case 'heading_1': dispatchInsertText('\n# '); break;
      case 'heading_2': dispatchInsertText('\n## '); break;
      case 'heading_3': dispatchInsertText('\n### '); break;
      case 'heading_4': dispatchInsertText('\n#### '); break;
      case 'heading_5': dispatchInsertText('\n##### '); break;
      case 'heading_6': dispatchInsertText('\n###### '); break;
      case 'insert_table':
        dispatchInsertText('\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell | Cell | Cell |\n| Cell | Cell | Cell |\n');
        break;
      case 'insert_code_block':
        dispatchInsertText('\n```\n\n```\n');
        break;
      case 'insert_blockquote':
        dispatchInsertText('\n> ');
        break;
      case 'insert_hr':
        dispatchInsertText('\n---\n');
        break;
      case 'insert_task_list':
        dispatchInsertText('\n- [ ] ');
        break;

      // Settings
      case 'settings':
        // Emit custom event for toolbar to open settings dialog
        window.dispatchEvent(new CustomEvent('mdview:open-settings'));
        break;
    }
  }

  let unlisten: (() => void) | null = null;

  onMounted(async () => {
    try {
      unlisten = await listen<string>('menu-action', (event) => {
        handleMenuAction(event.payload);
      });
    } catch {
      // Not in Tauri environment (dev mode in browser)
    }
  });

  onUnmounted(() => {
    if (unlisten) unlisten();
  });
}
