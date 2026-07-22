import { onMounted, onUnmounted } from 'vue';
import { listen } from '@tauri-apps/api/event';
import { useFileStore } from '../stores/fileStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useEditorStore } from '../stores/editorStore';
import { INSERT_TEXT_EVENT, INSERT_WRAP_EVENT, SET_HEADING_EVENT, ADJUST_HEADING_EVENT, UNDO_EVENT, REDO_EVENT } from './useShortcut';

export function useMenuAction() {
  const fileStore = useFileStore();
  const settingsStore = useSettingsStore();
  const editorStore = useEditorStore();

  function focusEditorForClipboard() {
    const pmEl = document.querySelector('.ProseMirror') as any;
    if (pmEl && pmEl.pmViewDesc?.view) {
      pmEl.pmViewDesc.view.focus();
    } else if (pmEl) {
      (pmEl as HTMLElement).focus();
    }
  }

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
      case 'clear_recent':
        fileStore.clearRecentFiles();
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
        window.dispatchEvent(new CustomEvent(UNDO_EVENT));
        break;
      case 'redo':
        window.dispatchEvent(new CustomEvent(REDO_EVENT));
        break;
      case 'cut':
        focusEditorForClipboard();
        document.execCommand('cut');
        break;
      case 'copy':
        focusEditorForClipboard();
        document.execCommand('copy');
        break;
      case 'paste':
        try {
          const text = await navigator.clipboard.readText();
          dispatchInsertText(text);
        } catch {
          focusEditorForClipboard();
          document.execCommand('paste');
        }
        break;
      case 'select_all':
        focusEditorForClipboard();
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
      case 'underline':
        dispatchInsertWrap('<u>', '</u>');
        break;
      case 'inline_code':
        dispatchInsertWrap('`', '`');
        break;
      case 'inline_formula':
        dispatchInsertWrap('$', '$');
        break;
      case 'strikethrough':
        dispatchInsertWrap('~~', '~~');
        break;
      case 'comment':
        dispatchInsertWrap('<!--', '-->');
        break;
      case 'hyperlink':
        dispatchInsertWrap('[', '](url)');
        break;
      case 'insert_image':
        dispatchInsertText('\n![](image.png)\n');
        break;
      case 'insert_local_image':
        dispatchInsertText('\n![](local-image.png)\n');
        break;
      case 'clear_format':
        document.execCommand('removeFormat');
        break;

      // Paragraph - Headings (use SET_HEADING_EVENT to properly convert block type)
      case 'heading_1': window.dispatchEvent(new CustomEvent(SET_HEADING_EVENT, { detail: 1 })); break;
      case 'heading_2': window.dispatchEvent(new CustomEvent(SET_HEADING_EVENT, { detail: 2 })); break;
      case 'heading_3': window.dispatchEvent(new CustomEvent(SET_HEADING_EVENT, { detail: 3 })); break;
      case 'heading_4': window.dispatchEvent(new CustomEvent(SET_HEADING_EVENT, { detail: 4 })); break;
      case 'heading_5': window.dispatchEvent(new CustomEvent(SET_HEADING_EVENT, { detail: 5 })); break;
      case 'heading_6': window.dispatchEvent(new CustomEvent(SET_HEADING_EVENT, { detail: 6 })); break;
      case 'paragraph_text': window.dispatchEvent(new CustomEvent(SET_HEADING_EVENT, { detail: 0 })); break;
      case 'increase_heading': window.dispatchEvent(new CustomEvent(ADJUST_HEADING_EVENT, { detail: 1 })); break;
      case 'decrease_heading': window.dispatchEvent(new CustomEvent(ADJUST_HEADING_EVENT, { detail: -1 })); break;

      // Paragraph - Blocks
      case 'insert_table':
        dispatchInsertText('\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell | Cell | Cell |\n| Cell | Cell | Cell |\n');
        break;
      case 'formula_block':
        dispatchInsertText('\n$$\n\n$$\n');
        break;
      case 'code_block':
        dispatchInsertText('\n```\n\n```\n');
        break;

      // Paragraph - Lists
      case 'blockquote':
        dispatchInsertText('\n> ');
        break;
      case 'ordered_list':
        dispatchInsertText('\n1. ');
        break;
      case 'unordered_list':
        dispatchInsertText('\n- ');
        break;
      case 'task_list':
        dispatchInsertText('\n- [ ] ');
        break;

      // Paragraph - Other
      case 'horizontal_rule':
        dispatchInsertText('\n---\n');
        break;
      case 'link_reference':
        dispatchInsertWrap('[', '](url)');
        break;
      case 'footnote':
        dispatchInsertText('\n[^1]: ');
        break;

      // Settings
      case 'settings':
        window.dispatchEvent(new CustomEvent('mdview:open-settings'));
        break;

      // About
      case 'about':
        window.dispatchEvent(new CustomEvent('mdview:open-about'));
        break;
    }
  }

  let unlisten: (() => void) | null = null;
  let unlistenRecent: (() => void) | null = null;

  onMounted(async () => {
    try {
      unlisten = await listen<string>('menu-action', (event) => {
        handleMenuAction(event.payload);
      });

      unlistenRecent = await listen<string>('open-recent-file', (event) => {
        fileStore.openFile(event.payload);
      });
    } catch {
      // Not in Tauri environment (dev mode in browser)
    }
  });

  onUnmounted(() => {
    if (unlisten) unlisten();
    if (unlistenRecent) unlistenRecent();
  });
}
