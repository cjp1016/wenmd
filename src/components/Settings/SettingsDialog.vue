<script setup lang="ts">
import { useSettingsStore } from '../../stores/settingsStore';
import { useI18n } from '../../composables/useI18n';
import { invoke } from '@tauri-apps/api/core';
import type { ThemeMode } from '../../types';

const settings = useSettingsStore();
const { t, setLocale, locale } = useI18n();

const emit = defineEmits<{
  close: [];
}>();

const autoSaveOptions = [
  { label: '1s', value: 1000 },
  { label: '3s', value: 3000 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
];

function setAutoSaveInterval(ms: number) {
  settings.settings.autoSaveInterval = ms;
  settings.saveSettings();
}

async function changeLocale(loc: 'zh' | 'en') {
  setLocale(loc);
  try {
    await invoke('set_menu_locale', { locale: loc });
  } catch {
    // Not in Tauri environment (browser dev)
  }
}
</script>

<template>
  <div class="settings-overlay" @click.self="emit('close')">
    <div class="settings-dialog">
      <div class="settings-header">
        <h2>{{ t('settings_title') }}</h2>
        <button class="btn btn-icon" @click="emit('close')" :title="t('close')">×</button>
      </div>
      <div class="settings-body">
        <!-- Language -->
        <div class="setting-row">
          <label>{{ t('language') }}</label>
          <div class="setting-options">
            <button
              class="btn"
              :class="{ 'btn-primary': locale === 'zh' }"
              @click="changeLocale('zh')"
            >中文</button>
            <button
              class="btn"
              :class="{ 'btn-primary': locale === 'en' }"
              @click="changeLocale('en')"
            >English</button>
          </div>
        </div>

        <!-- Theme -->
        <div class="setting-row">
          <label>{{ t('theme') }}</label>
          <div class="setting-options">
            <button
              v-for="mode in (['light', 'sepia', 'dark', 'auto'] as ThemeMode[])"
              :key="mode"
              class="btn"
              :class="{ 'btn-primary': settings.settings.theme === mode }"
              @click="settings.setTheme(mode)"
            >{{ t(mode) }}</button>
          </div>
        </div>

        <!-- Font Size -->
        <div class="setting-row">
          <label>{{ t('font_size') }}: {{ settings.settings.fontSize }}px</label>
          <div class="setting-slider">
            <input
              type="range"
              min="12"
              max="28"
              :value="settings.settings.fontSize"
              @input="settings.setFontSize(parseInt(($event.target as HTMLInputElement).value))"
              class="slider"
            />
          </div>
        </div>

        <!-- Auto Save -->
        <div class="setting-row">
          <label>{{ t('auto_save') }}</label>
          <div class="setting-toggle">
            <button
              class="btn"
              :class="{ 'btn-primary': settings.settings.autoSave }"
              @click="settings.toggleAutoSave()"
            >{{ settings.settings.autoSave ? t('enabled') : t('disabled') }}</button>
          </div>
        </div>

        <!-- Auto Save Interval -->
        <div class="setting-row" v-if="settings.settings.autoSave">
          <label>{{ t('auto_save_interval') }}</label>
          <div class="setting-options">
            <button
              v-for="interval in autoSaveOptions"
              :key="interval.value"
              class="btn"
              :class="{ 'btn-primary': settings.settings.autoSaveInterval === interval.value }"
              @click="setAutoSaveInterval(interval.value)"
            >{{ interval.label }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-dialog {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  width: 480px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.settings-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.settings-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-row label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.setting-options {
  display: flex;
  gap: 8px;
}

.setting-slider {
  display: flex;
  align-items: center;
}

.slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  background: var(--bg-tertiary);
  border-radius: 3px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-color);
  cursor: pointer;
}

.setting-toggle {
  display: flex;
  gap: 8px;
}
</style>
