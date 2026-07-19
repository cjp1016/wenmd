// Type definitions for mdView

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileEntry[] | null;
}

export interface EditorTab {
  id: string;
  name: string;
  path: string | null;
  content: string;
  isDirty: boolean;
  isNew: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'sepia' | 'auto';
export type Locale = 'zh' | 'en' | 'auto';

export interface AppSettings {
  theme: ThemeMode;
  fontSize: number;
  fontFamily: string;
  sidebarWidth: number;
  sidebarVisible: boolean;
  locale: Locale;
}

export interface OutlineItem {
  level: number;
  text: string;
  id: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'auto',
  fontSize: 16,
  fontFamily: 'system-ui',
  sidebarWidth: 250,
  sidebarVisible: true,
  locale: 'auto',
};
