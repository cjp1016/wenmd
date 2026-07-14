import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useEditorStore = defineStore('editor', () => {
  const wordCount = ref(0);
  const charCount = ref(0);
  const lineCount = ref(0);
  const isFocusMode = ref(false);
  const isTypewriterMode = ref(false);
  const showFindReplace = ref(false);
  const showOutline = ref(false);

  function updateStats(content: string) {
    charCount.value = content.length;
    const words = content
      .replace(/[#*>`~\-\[\]()!_]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    wordCount.value = words.length;
    lineCount.value = content.split('\n').length;
  }

  function toggleFocusMode() {
    isFocusMode.value = !isFocusMode.value;
  }

  function toggleTypewriterMode() {
    isTypewriterMode.value = !isTypewriterMode.value;
  }

  function toggleFindReplace() {
    showFindReplace.value = !showFindReplace.value;
  }

  function toggleOutline() {
    showOutline.value = !showOutline.value;
  }

  return {
    wordCount,
    charCount,
    lineCount,
    isFocusMode,
    isTypewriterMode,
    showFindReplace,
    showOutline,
    updateStats,
    toggleFocusMode,
    toggleTypewriterMode,
    toggleFindReplace,
    toggleOutline,
  };
});
