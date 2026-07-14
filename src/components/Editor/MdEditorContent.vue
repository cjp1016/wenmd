<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, shallowRef } from 'vue';
import { Milkdown, useEditor } from '@milkdown/vue';
import { Crepe } from '@milkdown/crepe';
import { replaceAll, insert } from '@milkdown/kit/utils';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/classic.css';

import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { INSERT_TEXT_EVENT, INSERT_WRAP_EVENT } from '../../composables/useShortcut';

const editorStore = useEditorStore();
const fileStore = useFileStore();

const crepeInstance = shallowRef<Crepe | null>(null);
const isInternalChange = ref(false);

const { loading } = useEditor((root) => {
  const initialValue = fileStore.activeTab?.content || '';

  const crepe = new Crepe({
    root,
    defaultValue: initialValue,
    features: {
      [Crepe.Feature.Toolbar]: true,
      [Crepe.Feature.CodeMirror]: true,
      [Crepe.Feature.Placeholder]: true,
      [Crepe.Feature.ImageBlock]: true,
      [Crepe.Feature.Table]: true,
      [Crepe.Feature.LinkTooltip]: true,
      [Crepe.Feature.ListItem]: true,
      [Crepe.Feature.Cursor]: true,
      [Crepe.Feature.BlockEdit]: true,
      [Crepe.Feature.Latex]: false,
      [Crepe.Feature.TopBar]: false,
      [Crepe.Feature.AI]: false,
    },
    featureConfigs: {
      [Crepe.Feature.Placeholder]: {
        text: 'Start writing...',
        mode: 'doc',
      },
    },
  });

  crepeInstance.value = crepe;

  crepe.on((listener) => {
    listener.markdownUpdated((_ctx, markdown) => {
      if (isInternalChange.value) return;
      fileStore.updateContent(markdown);
      editorStore.updateStats(markdown);
    });
  });

  return crepe;
});

watch(
  () => fileStore.activeTabId,
  async () => {
    const crepe = crepeInstance.value;
    if (!crepe) return;
    await nextTick();
    const newContent = fileStore.activeTab?.content || '';
    const currentContent = crepe.getMarkdown();
    if (currentContent !== newContent) {
      isInternalChange.value = true;
      try {
        crepe.editor.action(replaceAll(newContent, false));
      } catch (e) {
        console.error('Failed to replace content:', e);
      }
      isInternalChange.value = false;
      editorStore.updateStats(newContent);
    }
  },
);

// Event handlers for keyboard shortcuts
function handleInsertText(e: Event) {
  const ce = e as CustomEvent<string>;
  const text = ce.detail;
  const crepe = crepeInstance.value;
  if (!crepe || !text) return;

  try {
    crepe.editor.action(insert(text));
  } catch (err) {
    console.error('Failed to insert text:', err);
  }
}

function handleInsertWrap(e: Event) {
  const ce = e as CustomEvent<{ prefix: string; suffix: string }>;
  const { prefix, suffix } = ce.detail;
  const crepe = crepeInstance.value;
  if (!crepe) return;

  // Get the ProseMirror view from the DOM element
  const pmEl = document.querySelector('.ProseMirror') as any;
  if (!pmEl || !pmEl.pmViewDesc) return;

  const view = pmEl.pmViewDesc.view;
  if (!view) return;

  const { from, to } = view.state.selection;
  const selectedText = view.state.doc.textBetween(from, to, '');
  const wrappedText = prefix + selectedText + suffix;
  const tr = view.state.tr.insertText(wrappedText, from, to);
  view.dispatch(tr);
}

onMounted(() => {
  window.addEventListener(INSERT_TEXT_EVENT, handleInsertText);
  window.addEventListener(INSERT_WRAP_EVENT, handleInsertWrap);

  if (fileStore.tabCount === 0) {
    fileStore.newFile();
  }
});

onUnmounted(() => {
  window.removeEventListener(INSERT_TEXT_EVENT, handleInsertText);
  window.removeEventListener(INSERT_WRAP_EVENT, handleInsertWrap);
});
</script>

<template>
  <div class="md-editor-container">
    <div v-if="loading" class="editor-loading">Loading...</div>
    <div class="crepe-wrapper">
      <Milkdown />
    </div>
  </div>
</template>

<style scoped>
.editor-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
  font-size: 13px;
}
</style>
