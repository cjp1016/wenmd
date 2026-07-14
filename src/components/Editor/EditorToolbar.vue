<script setup lang="ts">
import { ref } from 'vue';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useI18n } from '../../composables/useI18n';
import SettingsDialog from '../Settings/SettingsDialog.vue';

const fileStore = useFileStore();
const editorStore = useEditorStore();
const settings = useSettingsStore();
const { t } = useI18n();

const showSettings = ref(false);
const showMenu = ref(false);

function isMac() {
  return navigator.platform.toUpperCase().includes('MAC');
}

function toggleMenu() {
  showMenu.value = !showMenu.value;
}

function closeMenu() {
  showMenu.value = false;
}
</script>

<template>
  <div class="editor-toolbar">
    <!-- Left: menu button -->
    <div class="toolbar-left">
      <button class="toolbar-btn" @click="toggleMenu" :title="t('menu')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5"/>
          <circle cx="12" cy="12" r="1.5"/>
          <circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>

      <!-- Dropdown menu -->
      <div v-if="showMenu" class="dropdown-overlay" @click="closeMenu"></div>
      <div v-if="showMenu" class="dropdown-menu">
        <button class="dropdown-item" @click="fileStore.newFile(); closeMenu()">
          <span>{{ t('new_file') }}</span>
          <span class="shortcut">{{ isMac() ? '⌘N' : 'Ctrl+N' }}</span>
        </button>
        <button class="dropdown-item" @click="fileStore.openFile(); closeMenu()">
          <span>{{ t('open_file') }}</span>
          <span class="shortcut">{{ isMac() ? '⌘O' : 'Ctrl+O' }}</span>
        </button>
        <button class="dropdown-item" @click="fileStore.saveFile(false); closeMenu()">
          <span>{{ t('save') }}</span>
          <span class="shortcut">{{ isMac() ? '⌘S' : 'Ctrl+S' }}</span>
        </button>
        <button class="dropdown-item" @click="fileStore.saveFile(true); closeMenu()">
          <span>{{ t('save_as') }}</span>
          <span class="shortcut">{{ isMac() ? '⌘⇧S' : 'Ctrl+Shift+S' }}</span>
        </button>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item" @click="editorStore.toggleFindReplace(); closeMenu()">
          <span>{{ t('find') }}</span>
          <span class="shortcut">{{ isMac() ? '⌘F' : 'Ctrl+F' }}</span>
        </button>
        <button class="dropdown-item" @click="editorStore.toggleOutline(); closeMenu()">
          <span>{{ t('outline') }}</span>
          <span class="shortcut">{{ isMac() ? '⌘/' : 'Ctrl+/' }}</span>
        </button>
        <button class="dropdown-item" @click="editorStore.toggleFocusMode(); closeMenu()">
          <span>{{ t('focus_mode') }}</span>
          <span class="shortcut">{{ isMac() ? '⌘⇧F' : 'Ctrl+Shift+F' }}</span>
        </button>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item" @click="settings.setTheme(settings.settings.theme === 'dark' ? 'light' : 'dark'); closeMenu()">
          <span>{{ t('toggle_theme') }}</span>
        </button>
        <button class="dropdown-item" @click="showSettings = true; closeMenu()">
          <span>{{ t('settings') }}</span>
        </button>
      </div>
    </div>

    <!-- Center: file name -->
    <div class="toolbar-center">
      <span class="toolbar-title">{{ fileStore.activeTab?.name || 'mdView' }}</span>
    </div>

    <!-- Right: empty (kept for layout balance) -->
    <div class="toolbar-right"></div>
  </div>

  <SettingsDialog v-if="showSettings" @close="showSettings = false" />
</template>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 38px;
  padding: 0 8px;
  background: var(--toolbar-bg);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
  user-select: none;
  -webkit-app-region: drag;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 2px;
  -webkit-app-region: no-drag;
  position: relative;
}

.toolbar-center {
  flex: 1;
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  pointer-events: none;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0 12px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.12s;
}

.toolbar-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.toolbar-btn:active {
  background: var(--bg-active);
}

.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: var(--shadow-md);
  padding: 4px;
  min-width: 200px;
  z-index: 100;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 6px 10px;
  border: none;
  background: none;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.1s;
  text-align: left;
}

.dropdown-item:hover {
  background: var(--bg-hover);
}

.shortcut {
  color: var(--text-tertiary);
  font-size: 12px;
  margin-left: 16px;
}

.dropdown-divider {
  height: 1px;
  background: var(--border-light);
  margin: 4px 0;
}
</style>
