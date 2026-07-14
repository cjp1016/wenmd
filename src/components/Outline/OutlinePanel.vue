<script setup lang="ts">
import { computed } from 'vue';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useI18n } from '../../composables/useI18n';
import type { OutlineItem } from '../../types';

const editorStore = useEditorStore();
const fileStore = useFileStore();
const { t } = useI18n();

const outlineItems = computed<OutlineItem[]>(() => {
  const content = fileStore.activeTab?.content || '';
  const lines = content.split('\n');
  const items: OutlineItem[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = `heading-${items.length}`;
      items.push({ level, text, id });
    }
  }

  return items;
});

function jumpToHeading(_item: OutlineItem, index: number) {
  const editor = document.querySelector('.ProseMirror');
  if (!editor) return;

  const headings = editor.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (headings[index]) {
    headings[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
    (headings[index] as HTMLElement).classList.add('outline-highlight');
    setTimeout(() => {
      (headings[index] as HTMLElement).classList.remove('outline-highlight');
    }, 1500);
  }
}
</script>

<template>
  <div class="outline-panel" v-if="editorStore.showOutline">
    <div class="outline-header">
      <span>{{ t('outline') }}</span>
      <button class="btn btn-icon" @click="editorStore.toggleOutline()" :title="t('close')">×</button>
    </div>
    <div class="outline-list">
      <div
        v-for="(item, index) in outlineItems"
        :key="item.id"
        class="outline-item"
        :class="`outline-level-${item.level}`"
        @click="jumpToHeading(item, index)"
      >
        {{ item.text }}
      </div>
      <div v-if="outlineItems.length === 0" class="outline-empty">
        {{ t('no_headings') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.outline-panel {
  width: 240px;
  background: var(--sidebar-bg);
  border-left: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.outline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-light);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  height: 40px;
  flex-shrink: 0;
}

.outline-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.outline-item {
  padding: 4px 12px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.1s;
}

.outline-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.outline-level-1 { padding-left: 12px; font-weight: 600; font-size: 14px; }
.outline-level-2 { padding-left: 24px; font-weight: 500; }
.outline-level-3 { padding-left: 36px; }
.outline-level-4 { padding-left: 48px; font-size: 12px; }
.outline-level-5 { padding-left: 60px; font-size: 12px; }
.outline-level-6 { padding-left: 72px; font-size: 12px; color: var(--text-tertiary); }

.outline-empty {
  padding: 16px 12px;
  color: var(--text-tertiary);
  font-size: 13px;
  text-align: center;
}

:deep(.outline-highlight) {
  background: var(--accent-light) !important;
  border-radius: 4px;
  transition: background 0.3s;
}
</style>
