<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, shallowRef } from 'vue';
import { Milkdown, useEditor } from '@milkdown/vue';
import { Crepe } from '@milkdown/crepe';
import { replaceAll, insert } from '@milkdown/kit/utils';
import { splitBlock } from '@milkdown/kit/prose/commands';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/classic.css';

import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { INSERT_TEXT_EVENT, INSERT_WRAP_EVENT, REPLACE_TEXT_EVENT, REPLACE_ALL_EVENT, SET_HEADING_EVENT, ADJUST_HEADING_EVENT, UNDO_EVENT, REDO_EVENT, SELECT_MATCH_EVENT } from '../../composables/useShortcut';

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
        // Use flush=true to fully recreate editor state and avoid stale empty paragraphs
        crepe.editor.action(replaceAll(newContent, true));
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
  let text = ce.detail;
  const crepe = crepeInstance.value;
  if (!crepe || !text) return;

  try {
    // Smart newline handling: avoid extra empty paragraphs when inserting blocks
    if (text.startsWith('\n') && text !== '\n' && text !== '\n\n') {
      const pmEl = document.querySelector('.ProseMirror') as any;
      if (pmEl && pmEl.pmViewDesc?.view) {
        const view = pmEl.pmViewDesc.view;
        const { $from } = view.state.selection;
        const currentNode = $from.parent;
        const isEmptyParagraph = currentNode.textContent === '' && currentNode.childCount === 0;

        if (isEmptyParagraph) {
          // Current paragraph is empty: insert content directly without leading newlines
          text = text.replace(/^\n+/, '');
          if (text) {
            crepe.editor.action(insert(text));
          }
          return;
        }

        // Current paragraph has content: split block first, then insert
        splitBlock(view.state, view.dispatch);
        text = text.replace(/^\n+/, '');
        if (text) {
          crepe.editor.action(insert(text));
        }
        return;
      }
    }

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

// Helper: find the Nth occurrence of searchText in the ProseMirror doc
// Returns correct ProseMirror positions (not textContent indices)
function findTextInDoc(doc: any, searchText: string, n: number): { from: number; to: number } | null {
  if (!searchText) return null;
  const searchLower = searchText.toLowerCase();
  let count = 0;
  let result: { from: number; to: number } | null = null;

  doc.descendants((node: any, pos: number) => {
    if (result) return false;
    if (!node.isText || !node.text) return;
    const nodeLower = (node.text as string).toLowerCase();
    let searchFrom = 0;
    while (true) {
      const idx = nodeLower.indexOf(searchLower, searchFrom);
      if (idx === -1) break;
      if (count === n) {
        result = { from: pos + idx, to: pos + idx + searchText.length };
        return false;
      }
      count++;
      searchFrom = idx + 1;
    }
  });

  return result;
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

  // Find first occurrence using proper doc traversal
  const pos = findTextInDoc(view.state.doc, find, 0);
  if (!pos) return;

  const tr = view.state.tr.insertText(replace, pos.from, pos.to);
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

  // Find all occurrences using proper doc traversal
  const positions: Array<{ from: number; to: number }> = [];
  let index = 0;
  while (true) {
    const pos = findTextInDoc(view.state.doc, find, index);
    if (!pos) break;
    positions.push(pos);
    index++;
  }

  if (positions.length === 0) return;

  // Replace from end to start to preserve earlier positions
  let tr = view.state.tr;
  for (let i = positions.length - 1; i >= 0; i--) {
    tr = tr.insertText(replace, positions[i].from, positions[i].to);
  }
  view.dispatch(tr);
}

// Navigate to the Nth match and select it in ProseMirror
function handleSelectMatch(e: Event) {
  const ce = e as CustomEvent<{ text: string; index: number }>;
  const { text, index } = ce.detail;
  if (!text) return;

  const pmEl = document.querySelector('.ProseMirror') as any;
  if (!pmEl?.pmViewDesc?.view) return;
  const view = pmEl.pmViewDesc.view;

  const pos = findTextInDoc(view.state.doc, text, index);
  if (!pos) return;

  const { state } = view;
  // Create a selection from pos.from to pos.to by dispatching tr with cursor + scrollIntoView
  try {
    // Build a transaction that sets the selection to cover the matched text
    const tr = state.tr;
    // Use ProseMirror's selection mechanism via anchor/head approach
    const $from = state.doc.resolve(pos.from);
    const $to = state.doc.resolve(pos.to);
    // @ts-ignore
    const TextSel = state.selection.constructor;
    // @ts-ignore
    const newSel = TextSel.between ? TextSel.between($from, $to) : null;
    if (newSel) {
      tr.setSelection(newSel);
    } else {
      tr.setMeta('selectMatch', { from: pos.from, to: pos.to });
    }
    view.dispatch(tr.scrollIntoView());
    view.focus();
  } catch {
    // Fallback: just move cursor to position
    try {
      const tr = state.tr.setMeta('selectMatch', pos).scrollIntoView();
      view.dispatch(tr);
    } catch { /* ignore */ }
  }
}

// Watch source mode toggle: when switching back to WYSIWYG, reload content into editor
watch(
  () => editorStore.showSourceMode,
  async (isSource) => {
    if (!isSource) {
      // Switching back from source mode → reload content into Crepe
      await nextTick();
      const crepe = crepeInstance.value;
      if (!crepe) return;
      const newContent = fileStore.activeTab?.content || '';
      isInternalChange.value = true;
      try {
        crepe.editor.action(replaceAll(newContent, true));
      } catch (e) {
        console.error('Failed to reload content from source mode:', e);
      }
      isInternalChange.value = false;
    }
  }
);

// Source mode input handler
function handleSourceInput(e: Event) {
  const content = (e.target as HTMLTextAreaElement).value;
  fileStore.updateContent(content);
  editorStore.updateStats(content);
}

// Undo via simulated keyboard event on ProseMirror
function handleUndo() {
  const pm = document.querySelector('.ProseMirror') as HTMLElement | null;
  if (!pm) return;
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  pm.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'z', code: 'KeyZ',
    metaKey: isMac, ctrlKey: !isMac,
    bubbles: true, cancelable: true,
  }));
}

// Redo via simulated keyboard event on ProseMirror
function handleRedo() {
  const pm = document.querySelector('.ProseMirror') as HTMLElement | null;
  if (!pm) return;
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  pm.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'z', code: 'KeyZ',
    metaKey: isMac, ctrlKey: !isMac,
    shiftKey: true,
    bubbles: true, cancelable: true,
  }));
}

// Adjust heading level by delta (+1 = promote, -1 = demote)
function handleAdjustHeading(e: Event) {
  const ce = e as CustomEvent<number>;
  const delta = ce.detail;
  const pmEl = document.querySelector('.ProseMirror') as any;
  if (!pmEl || !pmEl.pmViewDesc) return;
  const view = pmEl.pmViewDesc.view;
  if (!view) return;

  const { state } = view;
  const { $from } = state.selection;
  const currentDepth = $from.depth;
  const currentNode = $from.node(currentDepth);

  const headingType = state.schema.nodes.heading;
  const paragraphType = state.schema.nodes.paragraph;
  if (!headingType || !paragraphType) return;

  let currentLevel = 0;
  if (currentNode.type === headingType) {
    currentLevel = currentNode.attrs.level;
  }

  const newLevel = Math.max(0, Math.min(6, currentLevel + delta));

  if (newLevel === 0) {
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
      { level: newLevel }
    );
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
  window.addEventListener(ADJUST_HEADING_EVENT, handleAdjustHeading);
  window.addEventListener(UNDO_EVENT, handleUndo);
  window.addEventListener(REDO_EVENT, handleRedo);
  window.addEventListener(SELECT_MATCH_EVENT, handleSelectMatch);

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
  window.removeEventListener(ADJUST_HEADING_EVENT, handleAdjustHeading);
  window.removeEventListener(UNDO_EVENT, handleUndo);
  window.removeEventListener(REDO_EVENT, handleRedo);
  window.removeEventListener(SELECT_MATCH_EVENT, handleSelectMatch);
});
</script>

<template>
  <div class="md-editor-container" :class="{ 'is-empty': isEditorEmpty && !editorStore.showSourceMode }">
    <div v-if="loading && !editorStore.showSourceMode" class="editor-loading">Loading...</div>
    <div v-show="!editorStore.showSourceMode" class="crepe-wrapper">
      <Milkdown />
    </div>
    <textarea
      v-if="editorStore.showSourceMode"
      class="source-editor"
      :value="fileStore.activeTab?.content || ''"
      @input="handleSourceInput"
      spellcheck="false"
      autocomplete="off"
    />
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

.source-editor {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 24px 60px;
  font-family: 'SF Mono', 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.7;
  background: var(--editor-bg, var(--bg-primary));
  color: var(--editor-text, var(--text-primary));
  tab-size: 2;
  word-wrap: break-word;
  white-space: pre-wrap;
}
</style>
