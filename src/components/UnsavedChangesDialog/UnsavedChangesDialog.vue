<script setup lang="ts">
import { useFileStore } from '../../stores/fileStore';
import { useI18n } from '../../composables/useI18n';

const fileStore = useFileStore();
const { t } = useI18n();

const emit = defineEmits<{
  close: [];
  saveAndClose: [];
  closeWithoutSaving: [];
}>();

const unsavedTabs = fileStore.getUnsavedTabs();
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <div class="dialog-content">
      <div class="dialog-header">
        <h2>{{ t('unsaved_changes_title') }}</h2>
      </div>
      <div class="dialog-body">
        <p class="dialog-message">{{ t('unsaved_changes_message') }}</p>
        <ul class="unsaved-list">
          <li v-for="tab in unsavedTabs" :key="tab.id">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
              <path d="M14 3v5h5"/>
            </svg>
            <span class="file-name">{{ tab.name }}</span>
            <span class="dirty-dot"></span>
          </li>
        </ul>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="emit('close')">
          {{ t('cancel_close') }}
        </button>
        <button class="btn btn-secondary" @click="emit('closeWithoutSaving')">
          {{ t('close_without_saving') }}
        </button>
        <button class="btn btn-primary" @click="emit('saveAndClose')">
          {{ t('save_and_close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.dialog-content {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  width: 480px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.dialog-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dialog-message {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.unsaved-list {
  list-style: none;
  margin: 0;
  padding: 8px 0;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
}

.unsaved-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  color: var(--text-secondary);
  font-size: 13px;
}

.unsaved-list li:hover {
  background: var(--bg-hover);
}

.file-name {
  flex: 1;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dirty-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--warning-color);
  flex-shrink: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
}

.btn {
  padding: 6px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn:hover {
  background: var(--bg-hover);
}

.btn-primary {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.btn-primary:hover {
  filter: brightness(0.95);
}

.btn-secondary {
  background: var(--bg-secondary);
}

[data-theme="dark"] .btn-secondary {
  background: var(--bg-tertiary);
}
</style>
