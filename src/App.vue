<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useFileStore } from './stores/fileStore';
import { useSettingsStore } from './stores/settingsStore';
import { useEditorStore } from './stores/editorStore';
import { useTheme } from './composables/useTheme';
import { useShortcut } from './composables/useShortcut';
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
const { t } = useI18n();

const sidebarWidth = ref(settingsStore.settings.sidebarWidth);

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

onMounted(() => {
  if (fileStore.tabCount === 0) {
    fileStore.newFile();
  }
});
</script>

<template>
  <div class="app-layout" :style="fontSizeStyle">
    <EditorToolbar />
    <div class="app-body">
      <!-- Sidebar with fixed collapse behavior -->
      <div
        class="sidebar-wrapper"
        :class="{ collapsed: !settingsStore.settings.sidebarVisible }"
        :style="settingsStore.settings.sidebarVisible ? sidebarStyle : {}"
      >
        <FileSidebar />
      </div>

      <!-- Resize handle -->
      <div
        v-if="settingsStore.settings.sidebarVisible"
        class="resize-handle"
        @mousedown="startDrag"
      ></div>

      <!-- Main editor area -->
      <div class="app-main" :class="editorClass">
        <EditorTabs />
        <div class="editor-area">
          <FindReplace />
          <MdEditor v-if="fileStore.activeTab" />
          <div v-else class="welcome-page">
            <svg class="welcome-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            <p class="welcome-text">{{ t('no_folder_opened') }}</p>
            <button class="btn-link welcome-action" @click="openFileFromWelcome">
              {{ t('open_file_dots') }}
            </button>
          </div>
        </div>
        <OutlinePanel v-if="editorStore.showOutline" />
      </div>
    </div>
    <StatusBar />
  </div>
</template>

<style>
.sidebar-wrapper {
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  transition: width 0.2s ease, opacity 0.15s ease;
}

.sidebar-wrapper.collapsed {
  width: 0 !important;
  opacity: 0;
  pointer-events: none;
}

.resize-handle {
  width: 1px;
  cursor: col-resize;
  background: var(--border-light);
  flex-shrink: 0;
  transition: background 0.15s;
}

.resize-handle:hover {
  background: var(--accent-color);
}

.editor-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}
</style>
