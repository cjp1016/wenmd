<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useFileStore } from './stores/fileStore';
import { useSettingsStore } from './stores/settingsStore';
import { useEditorStore } from './stores/editorStore';
import { useTheme } from './composables/useTheme';
import { useShortcut } from './composables/useShortcut';
import { useMenuAction } from './composables/useMenuAction';
import { useI18n } from './composables/useI18n';

import EditorToolbar from './components/Editor/EditorToolbar.vue';
import EditorTabs from './components/Editor/EditorTabs.vue';
import MdEditor from './components/Editor/MdEditor.vue';
import FileSidebar from './components/Sidebar/FileSidebar.vue';
import StatusBar from './components/StatusBar/StatusBar.vue';
import FindReplace from './components/FindReplace/FindReplace.vue';
import OutlinePanel from './components/Outline/OutlinePanel.vue';

const fileStore = useFileStore();
const settingsStore = useSettingsStore();
const editorStore = useEditorStore();

useTheme();
useShortcut();
useMenuAction();
const { t } = useI18n();

const sidebarWidth = ref(settingsStore.settings.sidebarWidth);
const isDragOver = ref(false);

let isDragging = false;
let startX = 0;
let startWidth = 0;

function startDrag(e: MouseEvent) {
  isDragging = true;
  startX = e.clientX;
  startWidth = sidebarWidth.value;
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  document.body.style.cursor = 'col-resize';
  e.preventDefault();
}

function onDrag(e: MouseEvent) {
  if (!isDragging) return;
  const diff = e.clientX - startX;
  sidebarWidth.value = Math.max(180, Math.min(500, startWidth + diff));
}

function stopDrag() {
  if (isDragging) {
    isDragging = false;
    settingsStore.setSidebarWidth(sidebarWidth.value);
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.body.style.cursor = '';
  }
}

const isMac = () => navigator.platform.toUpperCase().includes('MAC');

const editorClass = computed(() => ({
  'focus-mode': editorStore.isFocusMode,
  'typewriter-mode': editorStore.isTypewriterMode,
}));

const fontSizeStyle = computed(() => ({
  '--font-size': `${settingsStore.settings.fontSize}px`,
}));

const sidebarStyle = computed(() => ({
  width: sidebarWidth.value + 'px',
}));

async function openFileFromWelcome() {
  await fileStore.openFile();
}

// --- File drag & drop (2.6) ---
function onDragOver(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer?.types?.includes('Files')) {
    isDragOver.value = true;
  }
}

function onDragLeave(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  isDragOver.value = false;
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  isDragOver.value = false;

  const files = e.dataTransfer?.files;
  if (!files) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const name = file.name.toLowerCase();
    if (name.endsWith('.md') || name.endsWith('.markdown') || name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        const existing = fileStore.tabs.find((tab) => tab.name === file.name);
        if (existing) {
          fileStore.switchTab(existing.id);
          return;
        }
        const tab = {
          id: Date.now().toString(36) + Math.random().toString(36).substring(2),
          name: file.name,
          path: null,
          content,
          isDirty: false,
          isNew: false,
        };
        fileStore.tabs.push(tab);
        fileStore.activeTabId = tab.id;
      };
      reader.readAsText(file);
    }
  }
}

onMounted(() => {
  if (fileStore.tabCount === 0) {
    fileStore.newFile();
  }
});
</script>

<template>
  <div
    class="app-layout"
    :class="{ 'is-focus-mode': editorStore.isFocusMode }"
    :style="fontSizeStyle"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Drag overlay -->
    <div v-if="isDragOver" class="drag-overlay">
      <div class="drag-overlay-content">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
          <path d="M14 3v5h5"/>
        </svg>
        <p>{{ t('drop_files_here') }}</p>
      </div>
    </div>

    <EditorToolbar />
    <div class="app-body">
      <!-- Sidebar with smooth collapse animation (1.3) -->
      <div
        class="sidebar-wrapper"
        :class="{ collapsed: !settingsStore.settings.sidebarVisible }"
        :style="settingsStore.settings.sidebarVisible ? sidebarStyle : {}"
      >
        <FileSidebar />
      </div>

      <!-- Resize handle with wider hit area (1.2) -->
      <div
        v-if="settingsStore.settings.sidebarVisible"
        class="resize-handle"
        @mousedown="startDrag"
      >
        <div class="resize-handle-line"></div>
      </div>

      <!-- Main editor area -->
      <div class="app-main" :class="editorClass">
        <EditorTabs />
        <!-- Horizontal wrapper for editor + outline (1.1) -->
        <div class="editor-content-wrapper">
          <div class="editor-area">
            <FindReplace />
            <MdEditor v-if="fileStore.activeTab" />
            <!-- Welcome page (2.4) -->
            <div v-else class="welcome-page">
              <div class="welcome-brand">
                <svg class="welcome-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
                  <path d="M14 3v5h5"/>
                  <line x1="9" y1="13" x2="15" y2="13"/>
                  <line x1="9" y1="16" x2="13" y2="16"/>
                </svg>
                <h1 class="welcome-title">mdView</h1>
              </div>
              <div class="welcome-actions">
                <button class="welcome-btn" @click="fileStore.newFile()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
                    <path d="M14 3v5h5"/>
                    <line x1="12" y1="11" x2="12" y2="17"/>
                    <line x1="9" y1="14" x2="15" y2="14"/>
                  </svg>
                  {{ t('new_file') }}
                </button>
                <button class="welcome-btn" @click="openFileFromWelcome">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  {{ t('open_file') }}
                </button>
              </div>
              <div class="welcome-shortcuts">
                <div class="shortcut-hint">
                  <kbd>{{ isMac() ? '⌘' : 'Ctrl' }}</kbd><kbd>N</kbd>
                  <span>{{ t('new_file') }}</span>
                </div>
                <div class="shortcut-hint">
                  <kbd>{{ isMac() ? '⌘' : 'Ctrl' }}</kbd><kbd>O</kbd>
                  <span>{{ t('open_file') }}</span>
                </div>
                <div class="shortcut-hint">
                  <kbd>{{ isMac() ? '⌘' : 'Ctrl' }}</kbd><kbd>B</kbd>
                  <span>{{ t('toggle_sidebar') }}</span>
                </div>
                <div class="shortcut-hint">
                  <kbd>{{ isMac() ? '⌘' : 'Ctrl' }}</kbd><kbd>F</kbd>
                  <span>{{ t('find') }}</span>
                </div>
              </div>
            </div>
          </div>
          <!-- Outline now side-by-side with editor (1.1) -->
          <OutlinePanel v-if="editorStore.showOutline" />
        </div>
      </div>
    </div>
    <StatusBar />
  </div>
</template>

<style>
/* Sidebar: smooth width transition, no opacity jump (1.3) */
.sidebar-wrapper {
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-wrapper.collapsed {
  width: 0 !important;
  pointer-events: none;
}

/* Resize handle: visual 1px line, wider hit area (1.2) */
.resize-handle {
  width: 5px;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 5;
}

.resize-handle-line {
  width: 1px;
  height: 100%;
  background: var(--border-light);
  transition: background 0.15s, width 0.15s;
}

.resize-handle:hover .resize-handle-line {
  width: 2px;
  background: var(--accent-color);
  border-radius: 1px;
}

/* Editor area: column flex inside the row wrapper */
.editor-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  min-width: 0;
}

/* Horizontal wrapper: editor + outline side by side (1.1) */
.editor-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

/* Focus mode: collapse toolbar, sidebar, statusbar (1.4) */
.app-layout.is-focus-mode .editor-toolbar {
  height: 0;
  overflow: hidden;
  opacity: 0;
  border: none;
  padding: 0;
  transition: all 0.3s ease;
}

.app-layout.is-focus-mode .sidebar-wrapper,
.app-layout.is-focus-mode .resize-handle {
  width: 0 !important;
  overflow: hidden;
  pointer-events: none;
  transition: all 0.3s ease;
}

.app-layout.is-focus-mode .status-bar {
  height: 0;
  overflow: hidden;
  opacity: 0;
  border: none;
  padding: 0;
  transition: all 0.3s ease;
}

/* Drag overlay (2.6) */
.drag-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(74, 158, 255, 0.06);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
  pointer-events: none;
}

.drag-overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--accent-color);
  font-size: 16px;
  font-weight: 500;
  padding: 40px;
  border: 2px dashed var(--accent-color);
  border-radius: 16px;
  background: var(--bg-primary);
}

/* Welcome page (2.4) */
.welcome-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
  gap: 24px;
  user-select: none;
  padding: 40px;
}

.welcome-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.welcome-logo {
  width: 56px;
  height: 56px;
  color: var(--text-tertiary);
  opacity: 0.35;
}

.welcome-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: -0.5px;
}

.welcome-actions {
  display: flex;
  gap: 12px;
}

.welcome-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}

.welcome-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--accent-color);
}

.welcome-shortcuts {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.shortcut-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.shortcut-hint kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  padding: 1px 5px;
  font-size: 11px;
  font-family: inherit;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
}

.shortcut-hint span {
  margin-left: 4px;
}
</style>
