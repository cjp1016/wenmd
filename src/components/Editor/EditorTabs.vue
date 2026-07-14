<script setup lang="ts">
import { useFileStore } from '../../stores/fileStore';

const fileStore = useFileStore();
</script>

<template>
  <div class="editor-tabs" v-if="fileStore.tabCount > 1">
    <div class="tab-list">
      <div
        v-for="tab in fileStore.tabs"
        :key="tab.id"
        class="tab-item"
        :class="{ active: tab.id === fileStore.activeTabId }"
        @click="fileStore.switchTab(tab.id)"
      >
        <span class="tab-name">{{ tab.name }}</span>
        <span v-if="tab.isDirty" class="tab-dirty">●</span>
        <button
          class="tab-close"
          @click.stop="fileStore.closeTab(tab.id)"
          title="Close"
        >×</button>
      </div>
    </div>
    <button class="tab-new" @click="fileStore.newFile()" title="New file">+</button>
  </div>
</template>

<style scoped>
.editor-tabs {
  display: flex;
  align-items: center;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  padding: 0 4px 0 8px;
  height: 32px;
  flex-shrink: 0;
  overflow: hidden;
}

.tab-list {
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  height: 100%;
}

.tab-list::-webkit-scrollbar {
  height: 0;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 6px 0 12px;
  height: 100%;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  transition: all 0.12s;
  flex-shrink: 0;
  border-bottom: 2px solid transparent;
}

.tab-item:hover {
  color: var(--text-secondary);
  background: var(--bg-hover);
}

.tab-item.active {
  color: var(--text-primary);
  border-bottom-color: var(--accent-color);
}

.tab-dirty {
  color: var(--accent-color);
  font-size: 8px;
  margin-left: -2px;
}

.tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: none;
  color: var(--text-tertiary);
  font-size: 14px;
  cursor: pointer;
  border-radius: 3px;
  opacity: 0;
  transition: opacity 0.12s;
}

.tab-item:hover .tab-close,
.tab-item.active .tab-close {
  opacity: 0.6;
}

.tab-close:hover {
  opacity: 1 !important;
  background: var(--bg-active);
  color: var(--text-primary);
}

.tab-new {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: var(--text-tertiary);
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.12s;
  flex-shrink: 0;
  margin-left: 4px;
}

.tab-new:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
