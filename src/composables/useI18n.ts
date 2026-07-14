import { ref, computed, type Ref } from 'vue';
import { useSettingsStore } from '../stores/settingsStore';

export type Locale = 'zh' | 'en';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    'toggle_sidebar': 'Toggle sidebar',
    'find': 'Find',
    'menu': 'Menu',
    'new_file': 'New File',
    'open_file': 'Open File',
    'save': 'Save',
    'save_as': 'Save As...',
    'outline': 'Outline',
    'focus_mode': 'Focus Mode',
    'toggle_theme': 'Toggle Theme',
    'settings': 'Settings',
    'search_files': 'Search files...',
    'open_folder': 'Open Folder...',
    'change_folder': 'Change Folder...',
    'no_folder': 'No folder opened',
    'no_files': 'No files found',
    'no_results': 'No results',
    'saved': 'Saved',
    'unsaved': 'Unsaved',
    'saving': 'Saving...',
    'words': 'words',
    'chars': 'chars',
    'lines': 'lines',
    'no_folder_opened': 'No folder opened',
    'open_file_dots': 'Open File...',
    'find_dots': 'Find...',
    'replace_dots': 'Replace...',
    'replace': 'Replace',
    'replace_all': 'All',
    'no_results_found': 'No results',
    'previous': 'Previous',
    'next': 'Next',
    'toggle_replace': 'Toggle replace',
    'close': 'Close',
    'settings_title': 'Settings',
    'theme': 'Theme',
    'light': 'Light',
    'dark': 'Dark',
    'auto': 'Auto',
    'font_size': 'Font Size',
    'auto_save': 'Auto Save',
    'enabled': 'Enabled',
    'disabled': 'Disabled',
    'sidebar': 'Sidebar',
    'visible': 'Visible',
    'hidden': 'Hidden',
    'language': 'Language',
    'no_headings': 'No headings found',
    'untitled': 'Untitled.md',
    'close_tab': 'Close',
    'new_tab': 'New file',
    'unsaved_changes': 'has unsaved changes. Close anyway?',
  },
  zh: {
    'toggle_sidebar': '切换侧边栏',
    'find': '搜索',
    'menu': '菜单',
    'new_file': '新建文件',
    'open_file': '打开文件',
    'save': '保存',
    'save_as': '另存为...',
    'outline': '大纲',
    'focus_mode': '专注模式',
    'toggle_theme': '切换主题',
    'settings': '设置',
    'search_files': '搜索文件...',
    'open_folder': '打开文件夹...',
    'change_folder': '更换文件夹...',
    'no_folder': '未打开文件夹',
    'no_files': '未找到文件',
    'no_results': '无结果',
    'saved': '已保存',
    'unsaved': '未保存',
    'saving': '保存中...',
    'words': '字',
    'chars': '字符',
    'lines': '行',
    'no_folder_opened': '未打开文件夹',
    'open_file_dots': '打开文件...',
    'find_dots': '查找...',
    'replace_dots': '替换...',
    'replace': '替换',
    'replace_all': '全部',
    'no_results_found': '无结果',
    'previous': '上一个',
    'next': '下一个',
    'toggle_replace': '切换替换',
    'close': '关闭',
    'settings_title': '设置',
    'theme': '主题',
    'light': '浅色',
    'dark': '深色',
    'auto': '自动',
    'font_size': '字号',
    'auto_save': '自动保存',
    'enabled': '开启',
    'disabled': '关闭',
    'sidebar': '侧边栏',
    'visible': '显示',
    'hidden': '隐藏',
    'language': '语言',
    'no_headings': '无标题',
    'untitled': '未命名.md',
    'close_tab': '关闭',
    'new_tab': '新建文件',
    'unsaved_changes': '有未保存的修改，确认关闭？',
  },
};

let localeRef: Ref<Locale> | null = null;

export function useI18n() {
  const settings = useSettingsStore();

  if (!localeRef) {
    const detectLocale = (): Locale => {
      const saved = settings.settings.locale;
      if (saved === 'zh' || saved === 'en') return saved;
      return navigator.language.startsWith('zh') ? 'zh' : 'en';
    };
    localeRef = ref<Locale>(detectLocale());
  }

  function setLocale(loc: Locale) {
    localeRef!.value = loc;
    settings.settings.locale = loc;
    settings.saveSettings();
  }

  const t = computed(() => {
    return (key: string): string => {
      const locale: Locale = localeRef!.value;
      return translations[locale]?.[key] ?? key;
    };
  });

  return {
    locale: localeRef,
    setLocale,
    t,
  };
}
