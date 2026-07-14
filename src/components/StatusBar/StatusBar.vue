<script setup lang="ts">
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAutoSave } from '../../composables/useAutoSave';
import { useI18n } from '../../composables/useI18n';

const editorStore = useEditorStore();
const fileStore = useFileStore();
const settings = useSettingsStore();
const { isSaving } = useAutoSave();
const { t } = useI18n();
</script>

<template>
  <div class="status-bar">
    <!-- Left: save status -->
    <div class="status-left">
      <span v-if="isSaving" class="status-saving">{{ t('saving') }}</span>
      <span v-else-if="fileStore.activeTab?.isDirty" class="status-unsaved">{{ t('unsaved') }}</span>
      <span v-else-if="fileStore.activeTab" class="status-saved">{{ t('saved') }}</span>
    </div>

    <!-- Center -->
    <div class="status-center"></div>

    <!-- Right: word count + theme -->
    <div class="status-right">
      <span class="status-item" v-if="fileStore.activeTab">
        {{ editorStore.wordCount }} {{ t('words') }}
      </span>
      <button class="btn-link" @click="settings.setTheme(settings.settings.theme === 'dark' ? 'light' : 'dark')" :title="t('toggle_theme')">
        {{ settings.settings.theme === 'dark' ? '☀' : '☾' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 24px;
  padding: 0 10px;
  background: var(--statusbar-bg);
  border-top: 1px solid var(--border-light);
  font-size: 11px;
  color: var(--text-tertiary);
  flex-shrink: 0;
  user-select: none;
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.status-center {
  flex: 1;
}

.status-saved {
  color: var(--success-color);
}

.status-unsaved {
  color: var(--warning-color);
}

.status-saving {
  color: var(--text-tertiary);
}

.status-item {
  color: var(--text-tertiary);
}
</style>
