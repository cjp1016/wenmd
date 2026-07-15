<script setup lang="ts">
import { ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import type { FileEntry } from '../../types';
import { useI18n } from '../../composables/useI18n';

const props = defineProps<{
  item: FileEntry;
  level: number;
  activePath: string;
}>();

const emit = defineEmits<{
  'open-file': [path: string];
  'load-children': [path: string, resolve: (entries: FileEntry[]) => void];
  'refresh': [];
}>();

const { t } = useI18n();

const isExpanded = ref(false);
const children = ref<FileEntry[] | null>(null);
const isLoading = ref(false);
const isRenaming = ref(false);
const renameName = ref('');
const showContextMenu = ref(false);
const contextMenuPos = ref({ x: 0, y: 0 });

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

function onContextMenu(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  showContextMenu.value = true;
  contextMenuPos.value = { x: e.clientX, y: e.clientY };
  document.addEventListener('click', closeContextMenu, { once: true });
}

function closeContextMenu() {
  showContextMenu.value = false;
}

function startRename() {
  closeContextMenu();
  isRenaming.value = true;
  renameName.value = props.item.name;
  setTimeout(() => {
    const input = document.querySelector('.rename-input') as HTMLInputElement;
    if (input) {
      input.focus();
      const dotIdx = props.item.name.lastIndexOf('.');
      input.setSelectionRange(0, dotIdx > 0 ? dotIdx : props.item.name.length);
    }
  }, 50);
}

async function confirmRename() {
  if (!renameName.value || renameName.value === props.item.name) {
    isRenaming.value = false;
    return;
  }
  try {
    await invoke('rename_file', { oldPath: props.item.path, newName: renameName.value });
    emit('refresh');
  } catch (e) {
    alert(`Rename failed: ${e}`);
  }
  isRenaming.value = false;
}

function cancelRename() {
  isRenaming.value = false;
}

async function deleteFile() {
  closeContextMenu();
  const msg = props.item.is_dir
    ? t('confirm_delete_folder').replace('{name}', props.item.name)
    : t('confirm_delete').replace('{name}', props.item.name);
  if (!confirm(msg)) return;
  try {
    await invoke('delete_file', { path: props.item.path });
    emit('refresh');
  } catch (e) {
    alert(`Delete failed: ${e}`);
  }
}

const isActive = () => props.activePath === props.item.path;
</script>

<template>
  <div class="file-tree-item">
    <div
      class="tree-row"
      :class="{ active: isActive(), renaming: isRenaming }"
      :style="{ paddingLeft: `${level * 14 + 10}px` }"
      @click="handleClick"
      @contextmenu="onContextMenu"
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
      <input
        v-if="isRenaming"
        class="rename-input"
        v-model="renameName"
        @keydown.enter="confirmRename"
        @keydown.escape="cancelRename"
        @blur="confirmRename"
        @click.stop
      />
      <span v-else class="tree-name">{{ item.name }}</span>
    </div>

    <teleport to="body">
      <div
        v-if="showContextMenu"
        class="context-menu"
        :style="{ left: contextMenuPos.x + 'px', top: contextMenuPos.y + 'px' }"
      >
        <button class="context-menu-item" @click="startRename">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>
          </svg>
          {{ t('rename') }}
        </button>
        <div class="context-menu-divider"></div>
        <button class="context-menu-item danger" @click="deleteFile">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          {{ t('delete') }}
        </button>
      </div>
    </teleport>

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
          @refresh="emit('refresh')"
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

.rename-input {
  flex: 1;
  padding: 1px 4px;
  border: 1px solid var(--accent-color);
  border-radius: 3px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  min-width: 0;
}

.tree-row.renaming {
  background: none;
}

.context-menu {
  position: fixed;
  z-index: 9999;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 4px;
  min-width: 140px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 5px 8px;
  border: none;
  background: none;
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.1s;
  text-align: left;
}

.context-menu-item:hover {
  background: var(--bg-hover);
}

.context-menu-item.danger:hover {
  background: var(--danger-color);
  color: #fff;
}

.context-menu-divider {
  height: 1px;
  background: var(--border-light);
  margin: 3px 4px;
}
</style>
