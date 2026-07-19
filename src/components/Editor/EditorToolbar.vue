<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useEditorStore } from '../../stores/editorStore';
import { useI18n } from '../../composables/useI18n';
import { INSERT_TEXT_EVENT, INSERT_WRAP_EVENT, SET_HEADING_EVENT } from '../../composables/useShortcut';

const editorStore = useEditorStore();
const { t } = useI18n();

const isMacOS = ref(false);

function emitInsertText(text: string) {
  window.dispatchEvent(new CustomEvent(INSERT_TEXT_EVENT, { detail: text }));
}

function emitInsertWrap(prefix: string, suffix: string) {
  window.dispatchEvent(new CustomEvent(INSERT_WRAP_EVENT, { detail: { prefix, suffix } }));
}

// Format actions
function doBold() { emitInsertWrap('**', '**'); }
function doItalic() { emitInsertWrap('*', '*'); }
function doStrikethrough() { emitInsertWrap('~~', '~~'); }
function doInlineCode() { emitInsertWrap('`', '`'); }
function doHeading(level: number) {
  window.dispatchEvent(new CustomEvent(SET_HEADING_EVENT, { detail: level }));
}
function doList() { emitInsertText('\n- '); }
function doOrderedList() { emitInsertText('\n1. '); }
function doQuote() { emitInsertText('\n> '); }
function doCodeBlock() { emitInsertText('\n```\n\n```\n'); }
function doTable() { emitInsertText('\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell | Cell | Cell |\n| Cell | Cell | Cell |\n'); }
function doHr() { emitInsertText('\n---\n'); }
function doUndo() { document.execCommand('undo'); }
function doRedo() { document.execCommand('redo'); }

onMounted(() => {
  isMacOS.value = navigator.platform.toUpperCase().includes('MAC');
});
</script>

<template>
  <div class="editor-toolbar">
    <!-- Undo / Redo -->
    <button class="tool-btn" @click="doUndo" :title="t('undo')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 14 4 9 9 4"/>
        <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
      </svg>
    </button>
    <button class="tool-btn" @click="doRedo" :title="t('redo')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 14 20 9 15 4"/>
        <path d="M4 20v-7a4 4 0 0 1 4-4h12"/>
      </svg>
    </button>

    <div class="toolbar-sep"></div>

    <!-- Headings -->
    <button class="tool-btn" @click="doHeading(1)" :title="t('heading_1')">
      <span class="tool-btn-text">H1</span>
    </button>
    <button class="tool-btn" @click="doHeading(2)" :title="t('heading_2')">
      <span class="tool-btn-text">H2</span>
    </button>
    <button class="tool-btn" @click="doHeading(3)" :title="t('heading_3')">
      <span class="tool-btn-text">H3</span>
    </button>

    <div class="toolbar-sep"></div>

    <!-- Inline formatting -->
    <button class="tool-btn" @click="doBold()" :title="t('bold') + ' (' + (isMacOS ? '⌘B' : 'Ctrl+B') + ')'">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
        <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
      </svg>
    </button>
    <button class="tool-btn" @click="doItalic()" :title="t('italic') + ' (' + (isMacOS ? '⌘I' : 'Ctrl+I') + ')'">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="4" x2="10" y2="4"/>
        <line x1="14" y1="20" x2="5" y2="20"/>
        <line x1="15" y1="4" x2="9" y2="20"/>
      </svg>
    </button>
    <button class="tool-btn" @click="doStrikethrough()" :title="t('strikethrough')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 4H9a3 3 0 0 0-3 3v0a3 3 0 0 0 3 3h6a3 3 0 0 1 0 6H8"/>
        <line x1="4" y1="12" x2="20" y2="12"/>
      </svg>
    </button>
    <button class="tool-btn" @click="doInlineCode()" :title="t('inline_code') + ' (' + (isMacOS ? '⌘E' : 'Ctrl+E') + ')'">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    </button>

    <div class="toolbar-sep"></div>

    <!-- Links / Images -->
    <button class="tool-btn" @click="emitInsertText('[](url)')" :title="t('link')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    </button>
    <button class="tool-btn" @click="emitInsertText('![](url)')" :title="t('image')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="9" cy="9" r="2"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </button>

    <div class="toolbar-sep"></div>

    <!-- Lists / Quote -->
    <button class="tool-btn" @click="doList()" :title="t('list')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <circle cx="3.5" cy="6" r="1.5" fill="currentColor"/>
        <circle cx="3.5" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="3.5" cy="18" r="1.5" fill="currentColor"/>
      </svg>
    </button>
    <button class="tool-btn" @click="doOrderedList()" :title="t('list')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="10" y1="6" x2="21" y2="6"/>
        <line x1="10" y1="12" x2="21" y2="12"/>
        <line x1="10" y1="18" x2="21" y2="18"/>
        <text x="2" y="8" fill="currentColor" stroke="none" font-size="8" font-weight="600">1</text>
        <text x="2" y="14" fill="currentColor" stroke="none" font-size="8" font-weight="600">2</text>
        <text x="2" y="20" fill="currentColor" stroke="none" font-size="8" font-weight="600">3</text>
      </svg>
    </button>
    <button class="tool-btn" @click="doQuote()" :title="t('blockquote')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21"/>
        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 5v3"/>
      </svg>
    </button>

    <div class="toolbar-sep"></div>

    <!-- Table / HR / Code block -->
    <button class="tool-btn" @click="doTable()" :title="t('table')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="3" y1="15" x2="21" y2="15"/>
        <line x1="9" y1="3" x2="9" y2="21"/>
        <line x1="15" y1="3" x2="15" y2="21"/>
      </svg>
    </button>
    <button class="tool-btn" @click="doCodeBlock()" :title="t('code_block')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M8 8l-2 4 2 4"/>
        <path d="M16 8l2 4-2 4"/>
        <line x1="13" y1="7" x2="11" y2="17"/>
      </svg>
    </button>
    <button class="tool-btn" @click="doHr()" :title="t('hr')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="2" y1="12" x2="22" y2="12"/>
      </svg>
    </button>

    <!-- Source mode toggle (right-aligned) -->
    <div class="toolbar-sep"></div>
    <button
      class="tool-btn source-toggle-btn"
      :class="{ active: editorStore.showSourceMode }"
      @click="editorStore.toggleSourceMode()"
      :title="t('source_mode') + ' (' + (isMacOS ? '⌘' : 'Ctrl') + '/)'"
      style="margin-left: auto;"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    </button>

    <!-- Word count -->
    <span class="word-count">{{ editorStore.wordCount }} {{ t('words') }}</span>
  </div>
</template>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  height: 38px;
  min-height: 38px;
  padding: 0 10px;
  gap: 1px;
  background: var(--toolbar-bg);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
  user-select: none;
  overflow-x: auto;
}

.editor-toolbar::-webkit-scrollbar {
  height: 0;
}

.tool-btn {
  width: 30px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  border: none;
  background: transparent;
  color: var(--text-500);
  cursor: pointer;
  transition: all 0.12s ease;
  position: relative;
  flex-shrink: 0;
}

.tool-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tool-btn:active {
  background: var(--bg-active);
  transform: scale(0.96);
}

.tool-btn.active {
  background: var(--accent-light);
  color: var(--accent-color);
}

.tool-btn svg {
  width: 15px;
  height: 15px;
  stroke-width: 1.8;
}

.tool-btn-text {
  font-size: 11px;
  font-weight: 700;
  font-family: var(--font-sans);
  line-height: 1;
}

.toolbar-sep {
  width: 1px;
  height: 18px;
  background: var(--border-light);
  margin: 0 6px;
  flex-shrink: 0;
}

.source-toggle-btn {
  color: var(--text-400) !important;
}

.source-toggle-btn:hover {
  color: var(--text-primary) !important;
  background: var(--bg-hover) !important;
}

.source-toggle-btn.active {
  color: var(--accent-color) !important;
  background: var(--accent-light) !important;
}

.word-count {
  margin-left: 8px;
  font-size: 11px;
  color: var(--text-400);
  flex-shrink: 0;
  white-space: nowrap;
}
</style>
