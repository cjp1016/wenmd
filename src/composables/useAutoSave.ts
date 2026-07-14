import { watch, ref, onUnmounted } from 'vue';
import { useFileStore } from '../stores/fileStore';
import { useSettingsStore } from '../stores/settingsStore';

export function useAutoSave() {
  const fileStore = useFileStore();
  const settings = useSettingsStore();
  const isSaving = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  function scheduleSave() {
    if (!settings.settings.autoSave) return;
    const tab = fileStore.activeTab;
    if (!tab || !tab.path || tab.isNew) return;
    if (!tab.isDirty) return;

    if (timer) clearTimeout(timer);

    timer = setTimeout(async () => {
      if (!tab.path) return;
      isSaving.value = true;
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('save_file', { path: tab.path, content: tab.content });
        tab.isDirty = false;
      } catch (e) {
        console.error('Auto-save failed:', e);
      } finally {
        isSaving.value = false;
      }
    }, settings.settings.autoSaveInterval);
  }

  // Watch for content changes on the active tab
  watch(
    () => fileStore.activeTab?.content,
    () => scheduleSave(),
  );

  onUnmounted(() => {
    if (timer) clearTimeout(timer);
  });

  return { isSaving };
}
