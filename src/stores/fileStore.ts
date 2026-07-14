import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { EditorTab } from '../types';
import { invoke } from '@tauri-apps/api/core';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';

export const useFileStore = defineStore('file', () => {
  const tabs = ref<EditorTab[]>([]);
  const activeTabId = ref<string | null>(null);
  const currentFolderPath = ref<string | null>(null);

  const activeTab = computed(() =>
    tabs.value.find((t) => t.id === activeTabId.value) || null
  );

  const tabCount = computed(() => tabs.value.length);

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

  return {
    tabs,
    activeTabId,
    currentFolderPath,
    activeTab,
    tabCount,
    newFile,
    openFile,
    saveFile,
    closeTab,
    switchTab,
    updateContent,
  };
});
