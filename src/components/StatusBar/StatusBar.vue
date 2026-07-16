<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useAutoSave } from '../../composables/useAutoSave';
import { useI18n } from '../../composables/useI18n';

const editorStore = useEditorStore();
const fileStore = useFileStore();
const { isSaving } = useAutoSave();
const { t } = useI18n();

// Cursor position tracking
const cursorLine = ref(1);
const cursorCol = ref(1);

function updateCursorPosition() {
  const pm = document.querySelector('.ProseMirror') as HTMLElement | null;
  if (!pm) return;

  const pmDesc = (pm as any).pmViewDesc;
  if (!pmDesc || !pmDesc.view) return;

  const view = pmDesc.view;
  try {
    const { from } = view.state.selection;
    const resolvedPos = view.state.doc.resolve(from);
    cursorLine.value = resolvedPos.line;
    cursorCol.value = from - resolvedPos.start(resolvedPos.depth) + 1;
  } catch {
    // fallback if position resolution fails
  }
}

let cursorTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  cursorTimer = setInterval(updateCursorPosition, 200);
  document.addEventListener('selectionchange', updateCursorPosition);
});

onUnmounted(() => {
  if (cursorTimer) clearInterval(cursorTimer);
  document.removeEventListener('selectionchange', updateCursorPosition);
});
</script>

<template>
  <div class="status-bar">
    <!-- Left: save status + encoding + file type -->
    <div class="status-left">
      <div class="status-item status-save">
        <span class="status-dot" :class="{ saving: isSaving, unsaved: fileStore.activeTab?.isDirty }"></span>
        <span v-if="isSaving">{{ t('saving') }}</span>
        <span v-else-if="fileStore.activeTab?.isDirty">{{ t('unsaved') }}</span>
        <span v-else-if="fileStore.activeTab">{{ t('saved') }}</span>
      </div>
      <div class="status-sep"></div>
      <div class="status-item">UTF-8</div>
      <div class="status-sep"></div>
      <div class="status-item">Markdown</div>
    </div>

    <!-- Right: cursor + stats -->
    <div class="status-right" v-if="fileStore.activeTab">
      <div class="status-item cursor-pos">
        {{ t('line') }} {{ cursorLine }}, {{ t('col') }} {{ cursorCol }}
      </div>
      <div class="status-sep"></div>
      <div class="status-item">
        {{ editorStore.lineCount }} {{ t('lines') }}
      </div>
      <div class="status-sep"></div>
      <div class="status-item">
        {{ editorStore.wordCount }} {{ t('words') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 26px;
  min-height: 26px;
  padding: 0 12px;
  background: var(--statusbar-bg);
  border-top: 1px solid var(--border-light);
  font-size: 11px;
  color: var(--text-500);
  flex-shrink: 0;
  user-select: none;
}

[data-theme="dark"] .status-bar {
  background: rgba(28, 28, 30, 0.9);
  border-top-color: rgba(255, 255, 255, 0.06);
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 0;
  min-width: 0;
  flex-shrink: 0;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: default;
  color: var(--text-500);
  white-space: nowrap;
  padding: 0 4px;
}

.status-save {
  color: var(--text-secondary);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success-color);
  flex-shrink: 0;
}

.status-dot.unsaved {
  background: var(--warning-color);
}

.status-dot.saving {
  background: var(--text-400);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.status-sep {
  width: 1px;
  height: 10px;
  background: var(--border-light);
  margin: 0 6px;
  flex-shrink: 0;
}

.cursor-pos {
  font-variant-numeric: tabular-nums;
}
</style>
