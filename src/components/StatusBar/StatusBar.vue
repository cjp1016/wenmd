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
    // Calculate line/col from position
    const resolvedPos = view.state.doc.resolve(from);
    cursorLine.value = resolvedPos.line;
    cursorCol.value = from - resolvedPos.start(resolvedPos.depth) + 1;
  } catch {
    // fallback if position resolution fails
  }
}

let cursorTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  // Poll cursor position every 200ms when focused
  cursorTimer = setInterval(updateCursorPosition, 200);
  // Also listen for selection changes
  document.addEventListener('selectionchange', updateCursorPosition);
});

onUnmounted(() => {
  if (cursorTimer) clearInterval(cursorTimer);
  document.removeEventListener('selectionchange', updateCursorPosition);
});
</script>

<template>
  <div class="status-bar">
    <!-- Left: save status -->
    <div class="status-left">
      <span v-if="isSaving" class="status-saving">{{ t('saving') }}</span>
      <span v-else-if="fileStore.activeTab?.isDirty" class="status-unsaved">{{ t('unsaved') }}</span>
      <span v-else-if="fileStore.activeTab" class="status-saved">{{ t('saved') }}</span>
    </div>

    <!-- Center: cursor position + stats -->
    <div class="status-center" v-if="fileStore.activeTab">
      <span class="status-item cursor-pos">
        {{ t('line') }} {{ cursorLine }}, {{ t('col') }} {{ cursorCol }}
      </span>
      <span class="status-divider"></span>
      <span class="status-item">
        {{ editorStore.lineCount }} {{ t('lines') }}
      </span>
      <span class="status-divider"></span>
      <span class="status-item">
        {{ editorStore.wordCount }} {{ t('words') }}
      </span>
      <span class="status-divider"></span>
      <span class="status-item">
        {{ editorStore.charCount }} {{ t('chars') }}
      </span>
    </div>

    <!-- Right: file path -->
    <div class="status-right">
      <span class="status-item file-path" :title="fileStore.activeTab?.path || ''" v-if="fileStore.activeTab?.path">
        {{ fileStore.activeTab.path }}
      </span>
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
  gap: 8px;
  min-width: 0;
  flex-shrink: 0;
}

.status-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
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
  white-space: nowrap;
}

.status-divider {
  width: 1px;
  height: 10px;
  background: var(--border-color);
  flex-shrink: 0;
}

.cursor-pos {
  font-variant-numeric: tabular-nums;
}

.file-path {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  direction: rtl;
  text-align: left;
  font-size: 10px;
}
</style>
