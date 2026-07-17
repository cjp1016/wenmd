<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useFileStore } from '../../stores/fileStore';
import { invoke } from '@tauri-apps/api/core';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useI18n } from '../../composables/useI18n';
import FileTreeItem from './FileTreeItem.vue';
import type { FileEntry } from '../../types';

const fileStore = useFileStore();
const { t } = useI18n();

// Sidebar tab: 'files' or 'outline'
const activeTab = ref<'files' | 'outline'>('files');

const allFiles = ref<FileEntry[]>([]);
const currentPath = ref<string | null>(null);
const searchText = ref('');
const activeOutlineIndex = ref(-1);

function filterFiles(entries: FileEntry[], query: string): FileEntry[] {
  if (!query) return entries;
  const lower = query.toLowerCase();
  const result: FileEntry[] = [];

  for (const entry of entries) {
    if (entry.is_dir) {
      if (entry.name.toLowerCase().includes(lower)) {
        result.push(entry);
      } else if (entry.children && entry.children.length > 0) {
        const filteredChildren = filterFiles(entry.children, query);
        if (filteredChildren.length > 0) {
          result.push({ ...entry, children: filteredChildren });
        }
      }
    } else {
      if (entry.name.toLowerCase().includes(lower)) {
        result.push(entry);
      }
    }
  }
  return result;
}

const files = computed(() => filterFiles(allFiles.value, searchText.value));

// Outline items computed from active tab content
const outlineItems = computed(() => {
  const content = fileStore.activeTab?.content || '';
  const lines = content.split('\n');
  const items: { level: number; text: string; index: number }[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      items.push({ level, text, index: items.length });
    }
  }

  return items;
});

function jumpToHeading(index: number) {
  activeOutlineIndex.value = index;
  const targetItem = outlineItems.value[index];
  if (!targetItem) return;

  const editor = document.querySelector('.ProseMirror');
  if (!editor) return;

  const headings = editor.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const targetText = targetItem.text.trim().toLowerCase();

  // Match by text content first
  let targetEl: Element | null = null;
  let sameTextCount = 0;

  // Count how many headings before this one have the same text (for duplicate headings)
  for (let i = 0; i < index; i++) {
    if (outlineItems.value[i].text.trim().toLowerCase() === targetText) {
      sameTextCount++;
    }
  }

  // Find the Nth heading with matching text
  let matchCount = 0;
  for (const h of headings) {
    const hText = (h.textContent || '').trim().toLowerCase();
    if (hText === targetText) {
      if (matchCount === sameTextCount) {
        targetEl = h;
        break;
      }
      matchCount++;
    }
  }

  // Fallback to index-based match
  if (!targetEl && headings[index]) {
    targetEl = headings[index];
  }

  if (targetEl) {
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    (targetEl as HTMLElement).classList.add('outline-highlight');
    setTimeout(() => {
      (targetEl as HTMLElement).classList.remove('outline-highlight');
    }, 1500);
  }
}

async function openFolder(folderPath?: string) {
  let path = folderPath;
  if (!path) {
    const selected = await openDialog({
      directory: true,
      multiple: false,
    });
    if (!selected) return;
    path = selected as string;
  }

  currentPath.value = path;
  fileStore.currentFolderPath = path;
  fileStore.addRecentFolder(path);
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

async function refreshFiles() {
  if (currentPath.value) {
    await loadDirectory(currentPath.value);
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
    <!-- Icon tab bar for switching between outline and files -->
    <div class="sidebar-tabs">
      <button
        class="sidebar-tab-btn"
        :class="{ active: activeTab === 'outline' }"
        @click="activeTab = 'outline'"
        :title="t('outline')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
      </button>
      <button
        class="sidebar-tab-btn"
        :class="{ active: activeTab === 'files' }"
        @click="activeTab = 'files'"
        :title="t('toggle_sidebar')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    </div>

    <div class="sidebar-body">
    <!-- Outline panel -->
    <div class="sidebar-panel" v-show="activeTab === 'outline'">
      <div class="panel-content">
        <div
          v-for="(item, index) in outlineItems"
          :key="index"
          class="outline-item"
          :class="[`outline-level-${item.level}`, { 'is-active': activeOutlineIndex === index }]"
          @click="jumpToHeading(index)"
        >
          <span v-if="item.level > 1" class="outline-dot"></span>
          {{ item.text }}
        </div>
        <div v-if="outlineItems.length === 0" class="sidebar-empty">
          {{ t('no_headings') }}
        </div>
      </div>
    </div>

    <!-- Files panel -->
    <div class="sidebar-panel" v-show="activeTab === 'files'">
      <!-- Search + actions -->
      <div class="sidebar-top">
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

        <div class="sidebar-actions">
          <button class="sidebar-action-btn action-new-file" @click="fileStore.newFile()" :title="t('new_file')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
              <path d="M14 3v5h5"/>
              <line x1="12" y1="11" x2="12" y2="17"/>
              <line x1="9" y1="14" x2="15" y2="14"/>
            </svg>
          </button>
          <button class="sidebar-action-btn action-open-file" @click="fileStore.openFile()" :title="t('open_file')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
              <path d="M14 3v5h5"/>
            </svg>
          </button>
          <button class="sidebar-action-btn action-open-folder" @click="openFolder()" :title="currentPath ? t('change_folder') : t('open_folder')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
            </svg>
          </button>
          <button class="sidebar-action-btn action-refresh" @click="refreshFiles()" :title="t('refresh')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23,4 23,10 17,10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Recent files -->
      <div class="recent-section" v-if="fileStore.recentFiles.length > 0 && !currentPath">
        <div class="recent-header">
          <span class="recent-title">{{ t('recent_files') }}</span>
          <button class="recent-clear" @click="fileStore.clearRecentFiles()" :title="t('clear_recent')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
        <div class="recent-list">
          <button
            v-for="path in fileStore.recentFiles.slice(0, 5)"
            :key="path"
            class="recent-item"
            @click="fileStore.openFile(path)"
            :title="path"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
              <path d="M14 3v5h5"/>
            </svg>
            <span class="recent-item-name">{{ path.split(/[/\\]/).pop() }}</span>
          </button>
        </div>
      </div>

      <!-- Recent folders -->
      <div class="recent-section" v-if="fileStore.recentFolders.length > 0 && !currentPath">
        <div class="recent-header">
          <span class="recent-title">{{ t('recent_folders') }}</span>
          <button class="recent-clear" @click="fileStore.clearRecentFolders()" :title="t('clear_recent')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
        <div class="recent-list">
          <button
            v-for="path in fileStore.recentFolders.slice(0, 5)"
            :key="path"
            class="recent-item"
            @click="openFolder(path)"
            :title="path"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
            </svg>
            <span class="recent-item-name">{{ path.split(/[/\\]/).pop() || path }}</span>
          </button>
        </div>
      </div>

      <div class="sidebar-header" v-if="currentPath">
        <span class="sidebar-title">{{ folderName() }}</span>
      </div>

      <div class="panel-content">
        <FileTreeItem
          v-for="item in files"
          :key="item.path"
          :item="item"
          :level="0"
          :active-path="fileStore.activeTab?.path || ''"
          @open-file="handleOpenFile"
          @load-children="loadSubDirectory"
          @refresh="refreshFiles"
        />
        <div v-if="!currentPath && fileStore.recentFiles.length === 0 && fileStore.recentFolders.length === 0" class="sidebar-empty">
          <p>{{ t('no_folder') }}</p>
        </div>
        <div v-else-if="currentPath && files.length === 0" class="sidebar-empty">
          <p>{{ searchText ? t('no_results') : t('no_files') }}</p>
        </div>
      </div>
    </div>
    </div><!-- end sidebar-body -->
  </div>
</template>

<style scoped>
.file-sidebar {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 100%;
  background: var(--sidebar-bg);
  overflow: hidden;
}

/* ===== Icon tab bar ===== */
.sidebar-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}

.sidebar-tab-btn {
  width: 36px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-400);
  cursor: pointer;
  border-radius: 6px;
  transition: all 150ms ease;
}

.sidebar-tab-btn:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.sidebar-tab-btn.active {
  background: var(--accent-light);
  color: var(--accent-color);
}

[data-theme="dark"] .sidebar-tab-btn.active {
  background: rgba(46, 141, 255, 0.15);
  color: var(--brand-400);
}

/* ===== Sidebar body: fills all space below tabs ===== */
.sidebar-body {
  flex: 1;
  min-height: 0;
  width: 100%;
  position: relative;
  background: var(--bg-primary);
  overflow: hidden;
}

/* ===== Panel switching ===== */
.sidebar-panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  width: 100%;
  background: var(--bg-primary);
}

.panel-content::-webkit-scrollbar {
  width: 4px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: var(--background-400);
  border-radius: 4px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: var(--background-500);
}

/* ===== Outline items ===== */
.outline-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 0.85em;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.12s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
  margin-bottom: 1px;
  border-left: 2.5px solid transparent;
}

.outline-item:hover {
  background: var(--bg-hover);
  color: var(--foreground);
}

.outline-item.is-active {
  color: var(--primary);
  border-left-color: var(--primary);
  font-weight: 600;
  background: var(--accent-light);
}

[data-theme="dark"] .outline-item.is-active {
  color: var(--brand-400);
  border-left-color: var(--brand-400);
  background: rgba(46, 141, 255, 0.1);
}

.outline-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--text-400);
  flex-shrink: 0;
}

.outline-item.is-active .outline-dot {
  background: var(--primary);
}

.outline-level-1 {
  padding-left: 12px;
  font-weight: 600;
  font-size: 1em;
}

.outline-level-2 {
  padding-left: 20px;
  font-weight: 500;
}

.outline-level-3 {
  padding-left: 34px;
  font-size: 0.95em;
}

.outline-level-4 {
  padding-left: 48px;
  font-size: 0.95em;
}

.outline-level-5 {
  padding-left: 60px;
  font-size: 0.9em;
}

.outline-level-6 {
  padding-left: 72px;
  font-size: 0.9em;
  color: var(--text-400);
}

/* ===== Files section (top area) ===== */
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
  color: var(--text-400);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 6px 8px 6px 28px;
  border: none;
  border-bottom: 1px solid var(--border-color);
  border-radius: 0;
  background: transparent;
  color: var(--foreground);
  font-size: 13px;
  font-family: var(--font-family, var(--font-sans));
  outline: none;
  transition: border-color 0.12s;
}

.search-input:focus {
  border-color: var(--accent-color);
}

.search-input::placeholder {
  color: var(--text-400);
}

.sidebar-actions {
  display: flex;
  gap: 4px;
}

.sidebar-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: var(--text-400);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.12s;
}

.sidebar-action-btn:hover {
  background: var(--bg-hover);
  color: var(--foreground);
}

.sidebar-action-btn.action-open-folder {
  color: var(--text-secondary);
}

.sidebar-action-btn.action-open-folder:hover {
  background: var(--bg-hover);
  color: var(--foreground);
}

.sidebar-header {
  padding: 6px 14px 4px;
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-400);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-empty {
  padding: 20px 12px;
  color: var(--text-400);
  font-size: 12px;
  text-align: center;
}

/* ===== Recent items ===== */
.recent-section {
  padding: 6px 10px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}

.recent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.recent-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-400);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.recent-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-400);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.12s;
}

.recent-clear:hover {
  background: var(--bg-hover);
  color: var(--state-error);
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 5px;
  font-size: 0.9em;
  font-family: var(--font-family, var(--font-sans));
  text-align: left;
  transition: all 0.12s;
  width: 100%;
}

.recent-item:hover {
  background: var(--bg-hover);
  color: var(--foreground);
}

.recent-item svg {
  flex-shrink: 0;
  color: var(--text-400);
}

.recent-item:hover svg {
  color: var(--primary);
}

.recent-item-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== Outline highlight animation ===== */
:deep(.outline-highlight) {
  background: var(--accent-light) !important;
  border-radius: 4px;
  transition: background 0.3s;
}
</style>
