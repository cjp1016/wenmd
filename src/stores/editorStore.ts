import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useEditorStore = defineStore('editor', () => {
  const wordCount = ref(0);
  const charCount = ref(0);
  const lineCount = ref(0);
  const isFocusMode = ref(false);
  const isTypewriterMode = ref(false);
  const showFindReplace = ref(false);
  const showSourceMode = ref(false);

  function updateStats(content: string) {
    charCount.value = content.length;

    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = content
      .replace(/[\u4e00-\u9fa5]/g, ' ')
      .replace(/[#*>`~\-\[\]()!_\.,;:?'"{}<>]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);

    wordCount.value = chineseChars + englishWords.length;

    if (content.length === 0) {
      lineCount.value = 1;
    } else if (content.endsWith('\n')) {
      lineCount.value = content.split('\n').length - 1;
    } else {
      lineCount.value = content.split('\n').length;
    }
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

  function toggleSourceMode() {
    showSourceMode.value = !showSourceMode.value;
  }

  return {
    wordCount,
    charCount,
    lineCount,
    isFocusMode,
    isTypewriterMode,
    showFindReplace,
    showSourceMode,
    updateStats,
    toggleFocusMode,
    toggleTypewriterMode,
    toggleFindReplace,
    toggleSourceMode,
  };
});
