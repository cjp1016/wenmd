import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useSettingsStore } from '../stores/settingsStore';
import type { ThemeMode } from '../types';

export function useTheme() {
  const settings = useSettingsStore();
  const effectiveTheme = ref<'light' | 'dark'>('light');
  let mediaQuery: MediaQueryList | null = null;
  let mediaHandler: ((e: MediaQueryListEvent) => void) | null = null;

  function getEffectiveTheme(mode: ThemeMode): 'light' | 'dark' {
    if (mode === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
  }

  function applyTheme(theme: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
    effectiveTheme.value = theme;
  }

  function updateTheme() {
    const theme = getEffectiveTheme(settings.settings.theme);
    applyTheme(theme);
  }

  onMounted(() => {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaHandler = () => {
      if (settings.settings.theme === 'auto') {
        updateTheme();
      }
    };
    mediaQuery.addEventListener('change', mediaHandler);
    updateTheme();
  });

  onUnmounted(() => {
    if (mediaQuery && mediaHandler) {
      mediaQuery.removeEventListener('change', mediaHandler);
    }
  });

  watch(() => settings.settings.theme, updateTheme);

  return {
    effectiveTheme,
    currentTheme: settings.settings.theme,
    setTheme: settings.setTheme,
    updateTheme,
  };
}
