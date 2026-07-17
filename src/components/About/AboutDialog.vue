<script setup lang="ts">
import { useI18n } from '../../composables/useI18n';

const { t } = useI18n();

const emit = defineEmits<{
  close: [];
}>();

const AUTHOR = '陈介鹏';
const GITHUB_USER = 'cjp1016';
const GITHUB_REPO = 'https://github.com/cjp1016/wenmd';
const VERSION = '0.1.0';

async function openUrl(url: string) {
  try {
    const { openUrl: tauriOpen } = await import('@tauri-apps/plugin-opener');
    await tauriOpen(url);
  } catch {
    // Not in Tauri environment (browser dev)
    window.open(url, '_blank');
  }
}
</script>

<template>
  <div class="about-overlay" @click.self="emit('close')">
    <div class="about-dialog">
      <div class="about-header">
        <h2>{{ t('about_title') }}</h2>
        <button class="btn btn-icon" @click="emit('close')" :title="t('close')">&times;</button>
      </div>
      <div class="about-body">
        <!-- Brand -->
        <div class="about-brand">
          <div class="about-icon">M</div>
          <h1 class="about-title">WenMd</h1>
          <span class="about-version">v{{ VERSION }}</span>
        </div>

        <hr class="about-divider" />

        <!-- Info -->
        <div class="about-info">
          <div class="about-row">
            <span class="about-label">{{ t('about_version') }}</span>
            <span class="about-value">0.1.0</span>
          </div>
          <div class="about-row">
            <span class="about-label">{{ t('about_author') }}</span>
            <span class="about-value">{{ AUTHOR }}</span>
          </div>
          <div class="about-row">
            <span class="about-label">{{ t('about_github') }}</span>
            <a class="about-link" href="#" @click.prevent="openUrl(GITHUB_REPO)">{{ GITHUB_REPO }}</a>
          </div>
        </div>

        <hr class="about-divider" />

        <!-- Actions -->
        <div class="about-actions">
          <button class="about-action-btn" @click="openUrl('https://github.com/' + GITHUB_USER)" :title="t('about_follow')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>{{ t('about_follow') }}</span>
          </button>
          <button class="about-action-btn" @click="openUrl(GITHUB_REPO + '/stargazers')" :title="t('about_star')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span>{{ t('about_star') }}</span>
          </button>
          <button class="about-action-btn" @click="openUrl(GITHUB_REPO + '/issues')" :title="t('about_issue')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ t('about_issue') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.about-dialog {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  width: 420px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.about-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.about-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.about-body {
  padding: 32px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

/* Brand section */
.about-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.about-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--brand-500), var(--brand-600));
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 24px;
  line-height: 1;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.about-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--foreground);
  margin: 0;
}

.about-version {
  font-size: 12px;
  color: var(--text-400);
  font-weight: 500;
  background: var(--bg-tertiary);
  padding: 2px 10px;
  border-radius: 10px;
}

.about-divider {
  width: 100%;
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 0;
}

/* Info rows */
.about-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.about-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}

.about-label {
  color: var(--text-400);
  font-weight: 500;
  flex-shrink: 0;
}

.about-value {
  color: var(--foreground);
  text-align: right;
}

.about-link {
  color: var(--primary);
  text-decoration: none;
  font-size: 12px;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.about-link:hover {
  text-decoration: underline;
}

/* Action buttons */
.about-actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

.about-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.12s ease;
}

.about-action-btn:hover {
  background: var(--bg-hover);
  color: var(--primary);
  border-color: var(--primary);
}

[data-theme="dark"] .about-action-btn:hover {
  background: rgba(46, 141, 255, 0.08);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: var(--text-400);
  font-size: 18px;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.12s;
}

.btn-icon:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
