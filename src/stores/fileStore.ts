import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { EditorTab } from '../types';
import { invoke } from '@tauri-apps/api/core';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';

const RECENT_FILES_KEY = 'wenmd_recent_files';
const RECENT_FOLDERS_KEY = 'wenmd_recent_folders';
const MAX_RECENT = 20;

function loadRecent(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((s) => typeof s === 'string');
    }
  } catch {
    // ignore
  }
  return [];
}

function saveRecent(key: string, items: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export const useFileStore = defineStore('file', () => {
  const tabs = ref<EditorTab[]>([]);
  const activeTabId = ref<string | null>(null);
  const currentFolderPath = ref<string | null>(null);
  const recentFiles = ref<string[]>(loadRecent(RECENT_FILES_KEY));
  const recentFolders = ref<string[]>(loadRecent(RECENT_FOLDERS_KEY));

  const activeTab = computed(() =>
    tabs.value.find((t) => t.id === activeTabId.value) || null
  );

  const tabCount = computed(() => tabs.value.length);

  function addRecentFile(path: string) {
    if (!path) return;
    recentFiles.value = [path, ...recentFiles.value.filter((p) => p !== path)].slice(0, MAX_RECENT);
    saveRecent(RECENT_FILES_KEY, recentFiles.value);
  }

  function addRecentFolder(path: string) {
    if (!path) return;
    recentFolders.value = [path, ...recentFolders.value.filter((p) => p !== path)].slice(0, MAX_RECENT);
    saveRecent(RECENT_FOLDERS_KEY, recentFolders.value);
  }

  function clearRecentFiles() {
    recentFiles.value = [];
    localStorage.removeItem(RECENT_FILES_KEY);
  }

  function clearRecentFolders() {
    recentFolders.value = [];
    localStorage.removeItem(RECENT_FOLDERS_KEY);
  }

  function removeRecentFile(path: string) {
    recentFiles.value = recentFiles.value.filter((p) => p !== path);
    saveRecent(RECENT_FILES_KEY, recentFiles.value);
  }

  function removeRecentFolder(path: string) {
    recentFolders.value = recentFolders.value.filter((p) => p !== path);
    saveRecent(RECENT_FOLDERS_KEY, recentFolders.value);
  }

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  function newFile() {
    const tab: EditorTab = {
      id: generateId(),
      name: 'Untitled.md',
      path: null,
      content: '',
      isDirty: false,
      isNew: true,
    };
    tabs.value.push(tab);
    activeTabId.value = tab.id;
  }

  async function openFile(filePath?: string) {
    try {
      let path = filePath;
      if (!path) {
        const selected = await openDialog({
          multiple: false,
          filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }],
        });
        if (!selected) return;
        path = selected as string;
      }

      // Check if file is already open
      const existing = tabs.value.find((t) => t.path === path);
      if (existing) {
        activeTabId.value = existing.id;
        return;
      }

      const content = await invoke<string>('open_file', { path });
      const name = path.split(/[/\\]/).pop() || 'Untitled.md';
      const tab: EditorTab = {
        id: generateId(),
        name,
        path,
        content,
        isDirty: false,
        isNew: false,
      };
      tabs.value.push(tab);
      activeTabId.value = tab.id;
      addRecentFile(path);
    } catch (e) {
      console.error('Failed to open file:', e);
      alert(`Failed to open file: ${e}`);
    }
  }

  async function saveFile(saveAs = false) {
    const tab = activeTab.value;
    if (!tab) return;

    try {
      let path = tab.path;
      if (!path || saveAs) {
        const selected = await saveDialog({
          defaultPath: tab.name,
          filters: [{ name: 'Markdown', extensions: ['md'] }],
        });
        if (!selected) return;
        path = selected;
      }

      await invoke('save_file', { path, content: tab.content });
      tab.path = path;
      tab.name = path.split(/[/\\]/).pop() || tab.name;
      tab.isDirty = false;
      tab.isNew = false;
    } catch (e) {
      console.error('Failed to save file:', e);
      alert(`Failed to save file: ${e}`);
    }
  }

  async function exportHtml() {
    const tab = activeTab.value;
    if (!tab) return;

    try {
      const defaultName = tab.name.replace(/\.md$/, '') + '.html';
      const selected = await saveDialog({
        defaultPath: defaultName,
        filters: [{ name: 'HTML', extensions: ['html'] }],
      });
      if (!selected) return;

      await invoke('export_html', { content: tab.content, path: selected });
    } catch (e) {
      console.error('Failed to export HTML:', e);
      alert(`Failed to export HTML: ${e}`);
    }
  }

  function closeTab(tabId: string) {
    const idx = tabs.value.findIndex((t) => t.id === tabId);
    if (idx === -1) return;

    const tab = tabs.value[idx];
    if (tab.isDirty) {
      if (!confirm(`"${tab.name}" has unsaved changes. Close anyway?`)) {
        return;
      }
    }

    tabs.value.splice(idx, 1);
    if (activeTabId.value === tabId) {
      if (tabs.value.length > 0) {
        const newIdx = Math.min(idx, tabs.value.length - 1);
        activeTabId.value = tabs.value[newIdx].id;
      } else {
        activeTabId.value = null;
      }
    }
  }

  function switchTab(tabId: string) {
    activeTabId.value = tabId;
  }

  function updateContent(content: string) {
    const tab = activeTab.value;
    if (tab) {
      if (tab.content !== content) {
        tab.content = content;
        tab.isDirty = true;
      }
    }
  }

  // Sync recent files to native menu bar
  watch(
    recentFiles,
    (files) => {
      invoke('update_recent_files', { files }).catch(() => {
        // ignore if backend is not ready
      });
    },
    { deep: true }
  );

  return {
    tabs,
    activeTabId,
    currentFolderPath,
    recentFiles,
    recentFolders,
    activeTab,
    tabCount,
    newFile,
    openFile,
    saveFile,
    exportHtml,
    closeTab,
    switchTab,
    updateContent,
    addRecentFile,
    addRecentFolder,
    clearRecentFiles,
    clearRecentFolders,
    removeRecentFile,
    removeRecentFolder,
  };
});
