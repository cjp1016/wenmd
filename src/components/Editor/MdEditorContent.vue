<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, shallowRef } from 'vue';
import { Milkdown, useEditor } from '@milkdown/vue';
import { Crepe } from '@milkdown/crepe';
import { replaceAll, insert } from '@milkdown/kit/utils';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/classic.css';

import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { INSERT_TEXT_EVENT, INSERT_WRAP_EVENT, REPLACE_TEXT_EVENT, REPLACE_ALL_EVENT, SET_HEADING_EVENT } from '../../composables/useShortcut';

const editorStore = useEditorStore();
const fileStore = useFileStore();

const crepeInstance = shallowRef<Crepe | null>(null);
const isInternalChange = ref(false);
const isEditorEmpty = ref(true);

const { loading } = useEditor((root) => {
  const initialValue = fileStore.activeTab?.content || '';

  const crepe = new Crepe({
    root,
    defaultValue: initialValue,
    features: {
      [Crepe.Feature.Toolbar]: false,
      [Crepe.Feature.CodeMirror]: true,
      [Crepe.Feature.Placeholder]: true,
      [Crepe.Feature.ImageBlock]: true,
      [Crepe.Feature.Table]: true,
      [Crepe.Feature.LinkTooltip]: true,
      [Crepe.Feature.ListItem]: true,
      [Crepe.Feature.Cursor]: true,
      [Crepe.Feature.BlockEdit]: false,
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
      isEditorEmpty.value = markdown.trim().length === 0;
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
    isEditorEmpty.value = newContent.trim().length === 0;
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

function handleReplaceText(e: Event) {
  const ce = e as CustomEvent<{ find: string; replace: string }>;
  const { find, replace } = ce.detail;
  const crepe = crepeInstance.value;
  if (!crepe || !find) return;

  const pmEl = document.querySelector('.ProseMirror') as any;
  if (!pmEl || !pmEl.pmViewDesc) return;
  const view = pmEl.pmViewDesc.view;
  if (!view) return;

  // Find first occurrence and replace
  const docText = view.state.doc.textContent;
  const idx = docText.indexOf(find);
  if (idx === -1) return;

  const tr = view.state.tr.insertText(replace, idx, idx + find.length);
  view.dispatch(tr);
}

function handleReplaceAll(e: Event) {
  const ce = e as CustomEvent<{ find: string; replace: string }>;
  const { find, replace } = ce.detail;
  const crepe = crepeInstance.value;
  if (!crepe || !find) return;

  const pmEl = document.querySelector('.ProseMirror') as any;
  if (!pmEl || !pmEl.pmViewDesc) return;
  const view = pmEl.pmViewDesc.view;
  if (!view) return;

  // Replace all occurrences from end to start to preserve positions
  const docText = view.state.doc.textContent;
  let tr = view.state.tr;

  // Collect all match positions first
  const positions: number[] = [];
  let searchIdx = 0;
  while (searchIdx < docText.length) {
    const found = docText.indexOf(find, searchIdx);
    if (found === -1) break;
    positions.push(found);
    searchIdx = found + find.length;
  }

  // Replace from end to start
  for (let i = positions.length - 1; i >= 0; i--) {
    const pos = positions[i];
    tr = tr.insertText(replace, pos, pos + find.length);
  }

  if (positions.length > 0) {
    view.dispatch(tr);
  }
}

// Typora-style heading: convert current block to heading level (or paragraph if level=0)
function handleSetHeading(e: Event) {
  const ce = e as CustomEvent<number>;
  const level = ce.detail;
  const crepe = crepeInstance.value;
  if (!crepe) return;

  const pmEl = document.querySelector('.ProseMirror') as any;
  if (!pmEl || !pmEl.pmViewDesc) return;
  const view = pmEl.pmViewDesc.view;
  if (!view) return;

  const { state } = view;
  const { $from } = state.selection;

  // Get the heading node type from the schema
  const headingType = state.schema.nodes.heading;
  const paragraphType = state.schema.nodes.paragraph;
  if (!headingType || !paragraphType) return;

  // Check current block type
  const currentDepth = $from.depth;
  const currentNode = $from.node(currentDepth);

  if (level === 0) {
    // Convert to paragraph
    if (currentNode.type === paragraphType) return; // Already paragraph
    const tr = state.tr.setBlockType(
      $from.before(currentDepth),
      $from.after(currentDepth),
      paragraphType
    );
    view.dispatch(tr);
  } else {
    // Convert to heading of specified level
    const attrs = { level };
    // If already same heading level, toggle back to paragraph (Typora behavior)
    if (currentNode.type === headingType && currentNode.attrs.level === level) {
      const tr = state.tr.setBlockType(
        $from.before(currentDepth),
        $from.after(currentDepth),
        paragraphType
      );
      view.dispatch(tr);
    } else {
      const tr = state.tr.setBlockType(
        $from.before(currentDepth),
        $from.after(currentDepth),
        headingType,
        attrs
      );
      view.dispatch(tr);
    }
  }
}

onMounted(() => {
  window.addEventListener(INSERT_TEXT_EVENT, handleInsertText);
  window.addEventListener(INSERT_WRAP_EVENT, handleInsertWrap);
  window.addEventListener(REPLACE_TEXT_EVENT, handleReplaceText);
  window.addEventListener(REPLACE_ALL_EVENT, handleReplaceAll);
  window.addEventListener(SET_HEADING_EVENT, handleSetHeading);

  if (fileStore.tabCount === 0) {
    fileStore.newFile();
  }
});

onUnmounted(() => {
  window.removeEventListener(INSERT_TEXT_EVENT, handleInsertText);
  window.removeEventListener(INSERT_WRAP_EVENT, handleInsertWrap);
  window.removeEventListener(REPLACE_TEXT_EVENT, handleReplaceText);
  window.removeEventListener(REPLACE_ALL_EVENT, handleReplaceAll);
  window.removeEventListener(SET_HEADING_EVENT, handleSetHeading);
});
</script>

<template>
  <div class="md-editor-container" :class="{ 'is-empty': isEditorEmpty }">
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
