<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useI18n } from '../../composables/useI18n';
import { INSERT_TEXT_EVENT, INSERT_WRAP_EVENT } from '../../composables/useShortcut';
import SettingsDialog from '../Settings/SettingsDialog.vue';

const fileStore = useFileStore();
const editorStore = useEditorStore();
const settings = useSettingsStore();
const { t } = useI18n();

const showSettings = ref(false);
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
function doCode() { emitInsertWrap('`', '`'); }
function doHeading() { emitInsertText('\n## '); }
function doList() { emitInsertText('\n- '); }
function doQuote() { emitInsertText('\n> '); }
function doCodeBlock() { emitInsertText('\n```\n\n```\n'); }
function doTable() { emitInsertText('\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell | Cell | Cell |\n| Cell | Cell | Cell |\n'); }

function openSettingsFromEvent() {
  showSettings.value = true;
}

onMounted(() => {
  isMacOS.value = navigator.platform.toUpperCase().includes('MAC');
  window.addEventListener('mdview:open-settings', openSettingsFromEvent);
});

onUnmounted(() => {
  window.removeEventListener('mdview:open-settings', openSettingsFromEvent);
});
</script>

<template>
  <div class="editor-toolbar" :class="{ 'is-macos': isMacOS }">
    <!-- macOS traffic light padding -->
    <div v-if="isMacOS" class="traffic-light-space"></div>

    <!-- Left: sidebar toggle + format tools -->
    <div class="toolbar-left">
      <!-- Sidebar toggle -->
      <button
        class="toolbar-btn"
        :class="{ active: settings.settings.sidebarVisible }"
        @click="settings.toggleSidebar()"
        :title="t('toggle_sidebar')"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
      </button>

      <div class="toolbar-divider"></div>

      <!-- Format: Bold -->
      <button class="toolbar-btn" @click="doBold()" :title="t('bold') + ' (⇧⌘B)'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
        </svg>
      </button>

      <!-- Format: Italic -->
      <button class="toolbar-btn" @click="doItalic()" :title="t('italic') + ' (⌘I)'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="4" x2="10" y2="4"/>
          <line x1="14" y1="20" x2="5" y2="20"/>
          <line x1="15" y1="4" x2="9" y2="20"/>
        </svg>
      </button>

      <!-- Format: Inline Code -->
      <button class="toolbar-btn" @click="doCode()" :title="t('inline_code') + ' (⌘E)'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="16,18 22,12 16,6"/>
          <polyline points="8,6 2,12 8,18"/>
        </svg>
      </button>

      <div class="toolbar-divider"></div>

      <!-- Format: Heading -->
      <button class="toolbar-btn" @click="doHeading()" :title="t('heading')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 4v16"/>
          <path d="M18 4v16"/>
          <path d="M6 12h12"/>
        </svg>
      </button>

      <!-- Format: List -->
      <button class="toolbar-btn" @click="doList()" :title="t('list')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <circle cx="4" cy="6" r="1" fill="currentColor"/>
          <circle cx="4" cy="12" r="1" fill="currentColor"/>
          <circle cx="4" cy="18" r="1" fill="currentColor"/>
        </svg>
      </button>

      <!-- Format: Quote -->
      <button class="toolbar-btn" @click="doQuote()" :title="t('blockquote') + ' (⇧⌘Q)'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 8c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h2l-2 4h2.5l2-4V10c0-1.1-.9-2-2-2h-2.5z"/>
          <path d="M18 8c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h2l-2 4h2.5l2-4V10c0-1.1-.9-2-2-2h-2.5z"/>
        </svg>
      </button>

      <!-- Format: Code Block -->
      <button class="toolbar-btn" @click="doCodeBlock()" :title="t('code_block') + ' (⇧⌘K)'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M8 8l-2 4 2 4"/>
          <path d="M16 8l2 4-2 4"/>
          <line x1="13" y1="7" x2="11" y2="17"/>
        </svg>
      </button>

      <!-- Format: Table -->
      <button class="toolbar-btn" @click="doTable()" :title="t('table') + ' (⌘T)'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="3" y1="15" x2="21" y2="15"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
          <line x1="15" y1="3" x2="15" y2="21"/>
        </svg>
      </button>
    </div>

    <!-- Center: file name (draggable) -->
    <div class="toolbar-center">
      <span class="toolbar-title">
        {{ fileStore.activeTab?.name || 'mdView' }}
        <span v-if="fileStore.activeTab?.isDirty" class="dirty-dot">●</span>
      </span>
    </div>

    <!-- Right: view toggles -->
    <div class="toolbar-right">
      <!-- Outline toggle -->
      <button
        class="toolbar-btn"
        :class="{ active: editorStore.showOutline }"
        @click="editorStore.toggleOutline()"
        :title="t('outline') + ' (⌘/)'"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="4" y1="6" x2="14" y2="6"/>
          <line x1="4" y1="12" x2="18" y2="12"/>
          <line x1="4" y1="18" x2="12" y2="18"/>
          <circle cx="20" cy="6" r="1.5" fill="currentColor"/>
          <circle cx="20" cy="18" r="1" fill="currentColor"/>
        </svg>
      </button>

      <!-- Focus mode -->
      <button
        class="toolbar-btn"
        :class="{ active: editorStore.isFocusMode }"
        @click="editorStore.toggleFocusMode()"
        :title="t('focus_mode') + ' (⇧⌘F)'"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v4"/>
          <path d="M12 18v4"/>
          <path d="M2 12h4"/>
          <path d="M18 12h4"/>
        </svg>
      </button>

      <!-- Theme toggle -->
      <button
        class="toolbar-btn"
        @click="settings.setTheme(settings.settings.theme === 'dark' ? 'light' : 'dark')"
        :title="t('toggle_theme')"
      >
        <svg v-if="settings.settings.theme === 'dark'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>

      <!-- Settings -->
      <button class="toolbar-btn" @click="showSettings = true" :title="t('settings')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
    </div>
  </div>

  <SettingsDialog v-if="showSettings" @close="showSettings = false" />
</template>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  height: 38px;
  padding: 0 8px;
  background: var(--toolbar-bg);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
  user-select: none;
  -webkit-app-region: drag;
}

/* macOS: reserve space for traffic light buttons */
.editor-toolbar.is-macos {
  padding-left: 70px;
}

.traffic-light-space {
  display: none;
}

/* Button groups: not draggable */
.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 1px;
  -webkit-app-region: no-drag;
  position: relative;
  flex-shrink: 0;
}

.toolbar-left {
  gap: 1px;
}

.toolbar-right {
  gap: 1px;
  margin-left: auto;
}

/* Center: filename, acts as drag region */
.toolbar-center {
  flex: 1;
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0 12px;
  min-width: 0;
}

.toolbar-title {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.dirty-dot {
  color: var(--warning-color);
  font-size: 8px;
}

/* Toolbar buttons */
.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.12s;
}

.toolbar-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.toolbar-btn:active {
  background: var(--bg-active);
}

.toolbar-btn.active {
  color: var(--accent-color);
  background: var(--accent-light);
}

/* Vertical divider between button groups */
.toolbar-divider {
  width: 1px;
  height: 16px;
  background: var(--border-light);
  margin: 0 3px;
  flex-shrink: 0;
}
</style>
