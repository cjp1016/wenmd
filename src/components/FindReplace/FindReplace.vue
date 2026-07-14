<script setup lang="ts">
import { ref, watch } from 'vue';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useI18n } from '../../composables/useI18n';

const editorStore = useEditorStore();
const fileStore = useFileStore();
const { t } = useI18n();

const findText = ref('');
const replaceText = ref('');
const matchCount = ref(0);
const currentMatch = ref(0);
const showReplace = ref(false);

function close() {
  editorStore.showFindReplace = false;
  findText.value = '';
  replaceText.value = '';
  matchCount.value = 0;
}

function findNext() {
  if (matchCount.value > 0) {
    currentMatch.value = (currentMatch.value + 1) % matchCount.value;
  }
}

function findPrev() {
  if (matchCount.value > 0) {
    currentMatch.value = currentMatch.value === 0 ? matchCount.value - 1 : currentMatch.value - 1;
  }
}

function updateMatches() {
  const text = findText.value;
  if (!text) { matchCount.value = 0; return; }
  const content = fileStore.activeTab?.content || '';
  const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const matches = content.match(regex);
  matchCount.value = matches ? matches.length : 0;
}

function doReplace() {
  const tab = fileStore.activeTab;
  if (!tab || !findText.value) return;
  const regex = new RegExp(findText.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  tab.content = tab.content.replace(regex, replaceText.value);
  tab.isDirty = true;
  editorStore.updateStats(tab.content);
  updateMatches();
}

function doReplaceAll() {
  const tab = fileStore.activeTab;
  if (!tab || !findText.value) return;
  const regex = new RegExp(findText.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  tab.content = tab.content.replace(regex, replaceText.value);
  tab.isDirty = true;
  editorStore.updateStats(tab.content);
  updateMatches();
}

watch(findText, () => updateMatches());
</script>

<template>
  <div class="find-replace" v-if="editorStore.showFindReplace">
    <div class="fr-row">
      <input
        v-model="findText"
        class="input fr-input"
        :placeholder="t('find_dots')"
        @keydown.enter="findNext()"
        @keydown.escape="close()"
      />
      <button class="btn btn-icon" @click="findPrev()" :title="t('previous')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 15l-6-6-6 6"/>
        </svg>
      </button>
      <button class="btn btn-icon" @click="findNext()" :title="t('next')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      <button class="btn btn-icon" @click="showReplace = !showReplace" :title="t('toggle_replace')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path v-if="!showReplace" d="M12 5v14M5 12h14"/>
          <path v-else d="M5 12h14"/>
        </svg>
      </button>
      <button class="btn btn-icon" @click="close()" :title="t('close')">×</button>
    </div>
    <div class="fr-row" v-if="showReplace">
      <input
        v-model="replaceText"
        class="input fr-input"
        :placeholder="t('replace_dots')"
        @keydown.enter="doReplace()"
      />
      <button class="btn" @click="doReplace()">{{ t('replace') }}</button>
      <button class="btn" @click="doReplaceAll()">{{ t('replace_all') }}</button>
    </div>
    <div class="fr-info" v-if="findText">
      {{ matchCount > 0 ? `${currentMatch + 1}/${matchCount}` : t('no_results_found') }}
    </div>
  </div>
</template>

<style scoped>
.find-replace {
  position: absolute;
  top: 8px;
  right: 16px;
  z-index: 100;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 320px;
}

.fr-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.fr-input {
  flex: 1;
}

.fr-info {
  font-size: 12px;
  color: var(--text-tertiary);
  padding: 0 4px;
}
</style>
