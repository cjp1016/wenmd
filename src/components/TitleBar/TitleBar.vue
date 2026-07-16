<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useFileStore } from '../../stores/fileStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useEditorStore } from '../../stores/editorStore';
import { useI18n } from '../../composables/useI18n';
import SettingsDialog from '../Settings/SettingsDialog.vue';

const fileStore = useFileStore();
const settings = useSettingsStore();
const editorStore = useEditorStore();
const { t } = useI18n();

const showSettings = ref(false);
const isMacOS = ref(false);

onMounted(() => {
  isMacOS.value = navigator.platform.toUpperCase().includes('MAC');
  window.addEventListener('mdview:open-settings', openSettingsFromEvent);
});

onUnmounted(() => {
  window.removeEventListener('mdview:open-settings', openSettingsFromEvent);
});

function openSettingsFromEvent() {
  showSettings.value = true;
}

function triggerSearch() {
  editorStore.showFindReplace = true;
}
</script>

<template>
  <div class="title-bar" :class="{ 'is-macos': isMacOS }" data-tauri-drag-region>
    <!-- Left: App icon + title -->
    <div class="title-bar-left">
      <div class="app-icon">M</div>
      <span class="app-title">WenMd</span>
    </div>

    <!-- Center: File tabs -->
    <div class="title-bar-center" data-tauri-drag-region>
      <div class="tab-bar">
        <div
          v-for="tab in fileStore.tabs"
          :key="tab.id"
          class="tab-item"
          :class="{ active: tab.id === fileStore.activeTabId, modified: tab.isDirty }"
          @click="fileStore.switchTab(tab.id)"
        >
          <svg class="tab-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6l-4 2V4a2 2 0 0 1 2-2z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="tab-name">{{ tab.name }}</span>
          <span v-if="tab.isDirty" class="tab-dot"></span>
          <button
            class="tab-close"
            @click.stop="fileStore.closeTab(tab.id)"
            :title="t('close_tab')"
          >&times;</button>
        </div>
        <button class="tab-new" @click="fileStore.newFile()" :title="t('new_tab')">+</button>
      </div>
    </div>

    <!-- Right: Search / Settings / Theme -->
    <div class="title-bar-right">
      <button class="title-btn" @click="triggerSearch" :title="t('find')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
      <button class="title-btn" @click="showSettings = true" :title="t('settings')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
      <button
        class="title-btn"
        @click="settings.setTheme(settings.settings.theme === 'dark' ? 'light' : 'dark')"
        :title="t('toggle_theme')"
      >
        <svg v-if="settings.settings.theme === 'dark'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>
    </div>
  </div>

  <SettingsDialog v-if="showSettings" @close="showSettings = false" />
</template>

<style scoped>
.title-bar {
  height: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid color-mix(in srgb, var(--background-300) 60%, transparent);
  z-index: 10;
  user-select: none;
  -webkit-app-region: drag;
  flex-shrink: 0;
}

[data-theme="dark"] .title-bar {
  background: rgba(28, 28, 30, 0.85);
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.title-bar.is-macos {
  padding-left: 78px;
}

/* Left section */
.title-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  -webkit-app-region: no-drag;
}

.app-icon {
  width: 22px;
  height: 22px;
  background: linear-gradient(135deg, var(--brand-500), var(--brand-600));
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 13px;
  line-height: 1;
}

.app-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--foreground);
  letter-spacing: -0.01em;
  opacity: 0.9;
}

/* Center: tabs */
.title-bar-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  overflow: hidden;
  -webkit-app-region: no-drag;
}

.tab-bar {
  display: flex;
  align-items: center;
  height: 32px;
  background: var(--background-200);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
  overflow-x: auto;
  max-width: 60%;
}

[data-theme="dark"] .tab-bar {
  background: transparent;
}

.tab-bar::-webkit-scrollbar {
  height: 0;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 28px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-500);
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;
  white-space: nowrap;
  position: relative;
  flex-shrink: 0;
}

.tab-item:hover {
  color: var(--text-700);
  background: color-mix(in srgb, var(--background-300) 40%, transparent);
}

[data-theme="dark"] .tab-item:hover {
  color: var(--text-200);
  background: rgba(255, 255, 255, 0.04);
}

.tab-item.active {
  color: var(--text-800);
  background: var(--background-50);
  box-shadow: var(--shadow-2xs);
}

[data-theme="dark"] .tab-item.active {
  color: var(--text-50);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: none;
}

[data-theme="dark"] .tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 12px;
  right: 12px;
  height: 2px;
  background: var(--brand-400);
  border-radius: 2px 2px 0 0;
}

.tab-icon {
  width: 13px;
  height: 13px;
  opacity: 0.7;
  flex-shrink: 0;
}

.tab-name {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.tab-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-500);
  flex-shrink: 0;
}

.tab-close {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: var(--text-400);
  font-size: 12px;
  cursor: pointer;
  border-radius: 3px;
  opacity: 0;
  transition: opacity 0.12s;
  flex-shrink: 0;
  -webkit-app-region: no-drag;
}

.tab-item:hover .tab-close,
.tab-item.active .tab-close {
  opacity: 0.6;
}

.tab-close:hover {
  opacity: 1 !important;
  background: rgba(0, 0, 0, 0.08);
}

[data-theme="dark"] .tab-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tab-new {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: var(--text-400);
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.12s;
  flex-shrink: 0;
  -webkit-app-region: no-drag;
}

.tab-new:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Right section */
.title-bar-right {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
  -webkit-app-region: no-drag;
}

.title-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-500);
  cursor: pointer;
  transition: all 150ms ease;
}

.title-btn:hover {
  background: var(--background-200);
  color: var(--text-700);
}

[data-theme="dark"] .title-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-100);
}
</style>
