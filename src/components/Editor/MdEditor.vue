<script setup lang="ts">
import { MilkdownProvider } from '@milkdown/vue';
import MdEditorContent from './MdEditorContent.vue';
import EditorToolbar from './EditorToolbar.vue';
</script>

<template>
  <div class="md-editor-wrapper">
    <EditorToolbar />
    <MilkdownProvider>
      <MdEditorContent />
    </MilkdownProvider>
  </div>
</template>

<style scoped>
.md-editor-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}
</style>
