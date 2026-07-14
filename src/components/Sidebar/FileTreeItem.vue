<script setup lang="ts">
import { ref } from 'vue';
import type { FileEntry } from '../../types';

const props = defineProps<{
  item: FileEntry;
  level: number;
  activePath: string;
}>();

const emit = defineEmits<{
  'open-file': [path: string];
  'load-children': [path: string, resolve: (entries: FileEntry[]) => void];
}>();

const isExpanded = ref(false);
const children = ref<FileEntry[] | null>(null);
const isLoading = ref(false);

async function toggleExpand() {
  if (!props.item.is_dir) return;
  isExpanded.value = !isExpanded.value;

  if (isExpanded.value && children.value === null) {
    isLoading.value = true;
    await new Promise<void>((resolve) => {
      emit('load-children', props.item.path, (entries) => {
        children.value = entries;
        resolve();
      });
    });
    isLoading.value = false;
  }
}

function handleClick() {
  if (props.item.is_dir) {
    toggleExpand();
  } else {
    emit('open-file', props.item.path);
  }
}

const isActive = () => props.activePath === props.item.path;
</script>

<template>
  <div class="file-tree-item">
    <div
      class="tree-row"
      :class="{ active: isActive() }"
      :style="{ paddingLeft: `${level * 14 + 10}px` }"
      @click="handleClick"
    >
      <span class="tree-arrow" v-if="item.is_dir">
        <svg v-if="isExpanded" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
        <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 7l5 5-5 5z"/>
        </svg>
      </span>
      <span class="tree-arrow placeholder" v-else></span>
      <span class="tree-icon" v-if="item.is_dir">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        </svg>
      </span>
      <span class="tree-icon" v-else>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
          <path d="M14 3v5h5"/>
        </svg>
      </span>
      <span class="tree-name">{{ item.name }}</span>
    </div>

    <template v-if="item.is_dir && isExpanded">
      <div v-if="isLoading" class="tree-loading" :style="{ paddingLeft: `${(level + 1) * 14 + 10}px` }">
        Loading...
      </div>
      <template v-else-if="children && children.length > 0">
        <FileTreeItem
          v-for="child in children"
          :key="child.path"
          :item="child"
          :level="level + 1"
          :active-path="activePath"
          @open-file="(path) => emit('open-file', path)"
          @load-children="(path, resolve) => emit('load-children', path, resolve)"
        />
      </template>
    </template>
  </div>
</template>

<style scoped>
.tree-row {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px 3px 0;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  transition: background 0.08s;
  border-radius: 0;
}

.tree-row:hover {
  background: var(--bg-hover);
}

.tree-row.active {
  background: var(--accent-light);
  color: var(--accent-color);
}

.tree-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  flex-shrink: 0;
  color: var(--text-tertiary);
}

.tree-arrow.placeholder {
  width: 12px;
}

.tree-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  flex-shrink: 0;
  color: var(--text-tertiary);
}

.tree-row.active .tree-icon {
  color: var(--accent-color);
}

.tree-name {
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.tree-loading {
  padding: 2px 8px;
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>
