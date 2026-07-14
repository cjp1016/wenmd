<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useFileStore } from '../../stores/fileStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { invoke } from '@tauri-apps/api/core';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useI18n } from '../../composables/useI18n';
import FileTreeItem from './FileTreeItem.vue';
import type { FileEntry } from '../../types';

const fileStore = useFileStore();
const settingsStore = useSettingsStore();
const { t } = useI18n();

const allFiles = ref<FileEntry[]>([]);
const currentPath = ref<string | null>(null);
const searchText = ref('');

const files = computed(() => {
  if (!searchText.value) return allFiles.value;
  return allFiles.value.filter((item) =>
    item.name.toLowerCase().includes(searchText.value.toLowerCase())
  );
});

async function openFolder() {
  const selected = await openDialog({
    directory: true,
    multiple: false,
  });
  if (!selected) return;

  const path = selected as string;
  currentPath.value = path;
  fileStore.currentFolderPath = path;
  await loadDirectory(path);
}

async function loadDirectory(path: string) {
  try {
    const entries = await invoke<FileEntry[]>('list_directory', { path });
    allFiles.value = entries;
  } catch (e) {
    console.error('Failed to load directory:', e);
  }
}

async function handleOpenFile(filePath: string) {
  await fileStore.openFile(filePath);
}

async function loadSubDirectory(path: string): Promise<FileEntry[]> {
  try {
    return await invoke<FileEntry[]>('list_directory', { path });
  } catch (e) {
    console.error('Failed to load subdirectory:', e);
    return [];
  }
}

const folderName = () => {
  if (!currentPath.value) return '';
  const parts = currentPath.value.split(/[/\\]/);
  return parts[parts.length - 1] || currentPath.value;
};

onMounted(() => {
  if (fileStore.currentFolderPath) {
    currentPath.value = fileStore.currentFolderPath;
    loadDirectory(fileStore.currentFolderPath);
  }
});
</script>

<template>
  <div class="file-sidebar">
    <!-- Top: search + actions -->
    <div class="sidebar-top">
      <!-- Search bar -->
      <div class="sidebar-search">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="searchText"
          class="search-input"
          :placeholder="t('search_files')"
        />
      </div>

      <!-- Action buttons row -->
      <div class="sidebar-actions">
        <button class="sidebar-action-btn" @click="fileStore.newFile()" :title="t('new_file')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
            <path d="M14 3v5h5"/>
            <line x1="12" y1="11" x2="12" y2="17"/>
            <line x1="9" y1="14" x2="15" y2="14"/>
          </svg>
        </button>
        <button class="sidebar-action-btn" @click="fileStore.openFile()" :title="t('open_file')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <button class="sidebar-action-btn" @click="openFolder()" :title="currentPath ? t('change_folder') : t('open_folder')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
        </button>
      </div>

      <!-- Sidebar toggle (hamburger) -->
      <div class="sidebar-toggle-row">
        <button
          class="sidebar-toggle-btn"
          @click="settingsStore.toggleSidebar()"
          :title="t('toggle_sidebar') + ' (⌘B)'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Folder name header -->
    <div class="sidebar-header" v-if="currentPath">
      <span class="sidebar-title">{{ folderName() }}</span>
    </div>

    <!-- File tree -->
    <div class="sidebar-tree">
      <FileTreeItem
        v-for="item in files"
        :key="item.path"
        :item="item"
        :level="0"
        :active-path="fileStore.activeTab?.path || ''"
        @open-file="handleOpenFile"
        @load-children="loadSubDirectory"
      />
      <div v-if="!currentPath" class="sidebar-empty">
        <p>{{ t('no_folder') }}</p>
      </div>
      <div v-else-if="files.length === 0" class="sidebar-empty">
        <p>{{ searchText ? t('no_results') : t('no_files') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--sidebar-bg);
  overflow: hidden;
}

.sidebar-top {
  padding: 8px 10px 4px;
  flex-shrink: 0;
}

.sidebar-search {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.search-icon {
  position: absolute;
  left: 8px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 5px 8px 5px 28px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
  transition: border-color 0.12s;
}

.search-input:focus {
  border-color: var(--accent-color);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.sidebar-actions {
  display: flex;
  gap: 2px;
}

.sidebar-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.12s;
}

.sidebar-action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sidebar-toggle-row {
  display: flex;
  padding-top: 4px;
  border-top: 1px solid var(--border-light);
  margin-top: 4px;
}

.sidebar-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.12s;
}

.sidebar-toggle-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sidebar-header {
  padding: 6px 14px 4px;
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-tree {
  flex: 1;
  overflow-y: auto;
  padding: 2px 0;
}

.sidebar-empty {
  padding: 20px 12px;
  color: var(--text-tertiary);
  font-size: 12px;
  text-align: center;
}
</style>
