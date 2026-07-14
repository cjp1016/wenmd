<script setup lang="ts">
import { MilkdownProvider } from '@milkdown/vue';
import MdEditorContent from './MdEditorContent.vue';
</script>

<template>
  <MilkdownProvider>
    <MdEditorContent />
  </MilkdownProvider>
</template>
