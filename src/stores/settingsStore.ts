import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { AppSettings, ThemeMode } from '../types';
import { DEFAULT_SETTINGS } from '../types';

const STORAGE_KEY = 'mdview-settings';

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>({ ...DEFAULT_SETTINGS });

  // Load settings from localStorage
  function loadSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        settings.value = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      // Use defaults
    }
  }

  // Save settings to localStorage
  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value));
    } catch {
      // Ignore save errors
    }
  }

  function setTheme(theme: ThemeMode) {
    settings.value.theme = theme;
    saveSettings();
  }

  function setFontSize(size: number) {
    settings.value.fontSize = size;
    saveSettings();
  }

  function setFontFamily(family: string) {
    settings.value.fontFamily = family;
    saveSettings();
  }

  function toggleAutoSave() {
    settings.value.autoSave = !settings.value.autoSave;
    saveSettings();
  }

  function setSidebarWidth(width: number) {
    settings.value.sidebarWidth = width;
    saveSettings();
  }

  function toggleSidebar() {
    settings.value.sidebarVisible = !settings.value.sidebarVisible;
    saveSettings();
  }

  // Watch for changes and auto-save
  watch(settings, () => saveSettings(), { deep: true });

  // Initialize
  loadSettings();

  return {
    settings,
    setTheme,
    setFontSize,
    setFontFamily,
    toggleAutoSave,
    setSidebarWidth,
    toggleSidebar,
    saveSettings,
    loadSettings,
  };
});
