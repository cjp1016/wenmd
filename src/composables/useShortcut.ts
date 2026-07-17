import { onMounted, onUnmounted } from 'vue';
import { useFileStore } from '../stores/fileStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useEditorStore } from '../stores/editorStore';

// Custom event names for editor insertion
export const INSERT_TEXT_EVENT = 'mdview:insert-text';
export const INSERT_WRAP_EVENT = 'mdview:insert-wrap';
export const REPLACE_TEXT_EVENT = 'mdview:replace-text';
export const REPLACE_ALL_EVENT = 'mdview:replace-all';

export function useShortcut() {
  const fileStore = useFileStore();
  const settingsStore = useSettingsStore();
  const editorStore = useEditorStore();

  function isMac() {
    return navigator.platform.toUpperCase().includes('MAC');
  }

  function mod(e: KeyboardEvent) {
    return isMac() ? e.metaKey : e.ctrlKey;
  }

  // Dispatch event to editor for ProseMirror to handle
  function emitInsertText(text: string) {
    window.dispatchEvent(new CustomEvent(INSERT_TEXT_EVENT, { detail: text }));
  }

  function emitInsertWrap(prefix: string, suffix: string) {
    window.dispatchEvent(new CustomEvent(INSERT_WRAP_EVENT, { detail: { prefix, suffix } }));
  }

  function insertTable() {
    emitInsertText('\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell | Cell | Cell |\n| Cell | Cell | Cell |\n');
  }

  function insertCodeBlock() {
    emitInsertText('\n```\n\n```\n');
  }

  function insertBlockquote() {
    emitInsertText('\n> ');
  }

  function insertHr() {
    emitInsertText('\n---\n');
  }

  function insertTaskList() {
    emitInsertText('\n- [ ] ');
  }

  function insertOrderedList() {
    emitInsertText('\n1. ');
  }

  function insertUnorderedList() {
    emitInsertText('\n- ');
  }

  function insertLink() {
    emitInsertText('\n[](url)');
  }

  function insertFootnote() {
    emitInsertText('\n[^1]: ');
  }

  function focusEditor() {
    const pmEl = document.querySelector('.ProseMirror') as any;
    if (pmEl && pmEl.pmViewDesc?.view) {
      pmEl.pmViewDesc.view.focus();
    } else if (pmEl) {
      pmEl.focus();
    }
  }

  function isInputElement(target: EventTarget | null): target is HTMLElement {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
  }

  function handleKeyDown(e: KeyboardEvent) {
    // Cmd/Ctrl + O: Open file
    if (mod(e) && e.key === 'o' && !e.shiftKey) {
      e.preventDefault();
      fileStore.openFile();
      return;
    }

    // Cmd/Ctrl + S: Save
    if (mod(e) && e.key === 's' && !e.shiftKey) {
      e.preventDefault();
      fileStore.saveFile(false);
      return;
    }

    // Cmd/Ctrl + Shift + S: Save As
    if (mod(e) && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      fileStore.saveFile(true);
      return;
    }

    // Cmd/Ctrl + N: New file
    if (mod(e) && e.key === 'n' && !e.shiftKey) {
      e.preventDefault();
      fileStore.newFile();
      return;
    }

    // Cmd/Ctrl + W: Close tab
    if (mod(e) && e.key === 'w' && !e.shiftKey) {
      e.preventDefault();
      if (fileStore.activeTabId) {
        fileStore.closeTab(fileStore.activeTabId);
      }
      return;
    }

    // Cmd/Ctrl + Shift + B: Toggle sidebar
    if (mod(e) && e.shiftKey && e.key === 'B') {
      e.preventDefault();
      settingsStore.toggleSidebar();
      return;
    }

    // Cmd/Ctrl + F: Find
    if (mod(e) && e.key === 'f' && !e.shiftKey) {
      e.preventDefault();
      editorStore.showFindReplace = true;
      return;
    }

    // Cmd/Ctrl + H: Replace
    if (mod(e) && e.key === 'h' && !e.shiftKey) {
      e.preventDefault();
      editorStore.showFindReplace = true;
      return;
    }

    // Cmd/Ctrl + /: Toggle source mode
    if (mod(e) && e.key === '/') {
      e.preventDefault();
      editorStore.toggleSourceMode();
      return;
    }

    // Cmd/Ctrl + Shift + F: Focus mode
    if (mod(e) && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      editorStore.toggleFocusMode();
      return;
    }

    // Cmd/Ctrl + +: Increase font size
    if (mod(e) && e.key === '=') {
      e.preventDefault();
      settingsStore.setFontSize(Math.min(settingsStore.settings.fontSize + 1, 28));
      return;
    }

    // Cmd/Ctrl + -: Decrease font size
    if (mod(e) && e.key === '-') {
      e.preventDefault();
      settingsStore.setFontSize(Math.max(settingsStore.settings.fontSize - 1, 12));
      return;
    }

    // === Editor formatting shortcuts (standard shortcuts, work globally) ===
    if (isInputElement(e.target)) return;

    // Cmd/Ctrl + B: Bold
    if (mod(e) && e.key === 'b' && !e.shiftKey) {
      e.preventDefault();
      focusEditor();
      emitInsertWrap('**', '**');
      return;
    }

    // Cmd/Ctrl + I: Italic
    if (mod(e) && e.key === 'i' && !e.shiftKey) {
      e.preventDefault();
      focusEditor();
      emitInsertWrap('*', '*');
      return;
    }

    // Cmd/Ctrl + U: Underline
    if (mod(e) && e.key === 'u' && !e.shiftKey) {
      e.preventDefault();
      focusEditor();
      emitInsertWrap('<u>', '</u>');
      return;
    }

    // Cmd/Ctrl + `: Inline code (Typora style)
    if (mod(e) && e.key === '`') {
      e.preventDefault();
      focusEditor();
      emitInsertWrap('`', '`');
      return;
    }

    // Cmd/Ctrl + M: Inline formula
    if (mod(e) && e.key === 'm' && !e.shiftKey) {
      e.preventDefault();
      focusEditor();
      emitInsertWrap('$', '$');
      return;
    }

    // Cmd/Ctrl + Shift + `: Strikethrough
    if (mod(e) && e.shiftKey && e.key === '`') {
      e.preventDefault();
      focusEditor();
      emitInsertWrap('~~', '~~');
      return;
    }

    // Cmd/Ctrl + -: Comment
    if (mod(e) && !e.shiftKey && e.key === '-') {
      e.preventDefault();
      focusEditor();
      emitInsertWrap('<!--', '-->');
      return;
    }

    // Cmd/Ctrl + K: Hyperlink
    if (mod(e) && e.key === 'k' && !e.shiftKey) {
      e.preventDefault();
      focusEditor();
      emitInsertWrap('[', '](url)');
      return;
    }

    // Cmd/Ctrl + \: Clear formatting
    if (mod(e) && e.key === '\\') {
      e.preventDefault();
      focusEditor();
      document.execCommand('removeFormat');
      return;
    }

    // Cmd/Ctrl + Shift + I: Insert image
    if (mod(e) && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      focusEditor();
      emitInsertText('\n![](image.png)\n');
      return;
    }

    // Cmd/Ctrl + 1-6: Heading levels (Typora style)
    if (mod(e) && !e.shiftKey && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
      e.preventDefault();
      focusEditor();
      const level = parseInt(e.key);
      emitInsertText('\n' + '#'.repeat(level) + ' ');
      return;
    }

    // Cmd/Ctrl + 0: Paragraph (Typora style)
    if (mod(e) && !e.shiftKey && e.key === '0') {
      e.preventDefault();
      focusEditor();
      emitInsertText('\n');
      return;
    }

    // Cmd/Ctrl + Shift + C: Code block (Typora style)
    if (mod(e) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      focusEditor();
      insertCodeBlock();
      return;
    }

    // Cmd/Ctrl + T: Insert table
    if (mod(e) && e.key === 't' && !e.shiftKey) {
      e.preventDefault();
      focusEditor();
      insertTable();
      return;
    }

    // Cmd/Ctrl + Shift + Q: Blockquote
    if (mod(e) && e.shiftKey && e.key === 'Q') {
      e.preventDefault();
      focusEditor();
      insertBlockquote();
      return;
    }

    // Cmd/Ctrl + -: Horizontal rule (Typora style)
    if (mod(e) && !e.shiftKey && e.key === '-') {
      e.preventDefault();
      focusEditor();
      insertHr();
      return;
    }

    // Cmd/Ctrl + Shift + X: Task list
    if (mod(e) && e.shiftKey && e.key === 'X') {
      e.preventDefault();
      focusEditor();
      insertTaskList();
      return;
    }

    // Cmd/Ctrl + Shift + O: Ordered list (Typora style)
    if (mod(e) && e.shiftKey && e.key === 'O') {
      e.preventDefault();
      focusEditor();
      insertOrderedList();
      return;
    }

    // Cmd/Ctrl + Shift + U: Unordered list (Typora style)
    if (mod(e) && e.shiftKey && e.key === 'U') {
      e.preventDefault();
      focusEditor();
      insertUnorderedList();
      return;
    }

    // Cmd/Ctrl + Shift + L: Link (Typora style)
    if (mod(e) && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      focusEditor();
      insertLink();
      return;
    }

    // Cmd/Ctrl + Shift + R: Footnote (Typora style)
    if (mod(e) && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      focusEditor();
      insertFootnote();
      return;
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
}
