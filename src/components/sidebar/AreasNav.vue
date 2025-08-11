<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useMainStore } from '../../store';

const mainStore = useMainStore();

const emit = defineEmits(['toggle-collapse']);

/**
 * 目的：處理「切換至檔案總管」按鈕的點擊事件。
 */
function switchToExplorer() {
  mainStore.setSidebarMode('files');
}

/**
 * 目的：向上傳遞收合側欄的請求。
 */
function onToggleCollapse() {
  emit('toggle-collapse');
}
</script>

<template>
  <div class="areas-nav-container">
    <div class="nav-header">
      <div class="header-title-wrapper">
        <span class="header-icon">📚</span>
        <span class="header-title">領域</span>
      </div>
      
      <div class="header-actions">
        <button @click="switchToExplorer" title="切換至檔案總管">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.992-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31z"/>
          </svg>
        </button>
        <button @click="onToggleCollapse" title="收合側欄" class="collapse-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
            <path fill-rule="evenodd" d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="nav-list-container">
      <ul class="nav-list">
        <li class="nav-item">
          <a href="#" class="nav-link">個人成長</a>
        </li>
        <li class="nav-item">
          <a href="#" class="nav-link">健康管理</a>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* 樣式與 PersonalNav.vue 完全相同，確保外觀一致 */
.areas-nav-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.nav-header {
  padding: 0.5rem 1rem;
  min-height: 60px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
}

.header-title-wrapper {
  display: flex;
  align-items: center;
  overflow: hidden;
  color: var(--text-primary);
  width: 100%;
}

.header-icon {
  flex-shrink: 0;
  margin-right: 0.5rem;
  font-size: 14px;
}

.header-title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  align-items: center;
  width: 100%;
}

.header-actions button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  border-radius: 4px;
  cursor: pointer;
  padding: 5px;
  margin-right: 4px;
  transition: background-color 0.2s, color 0.2s;
}

.header-actions button:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.header-actions .collapse-button {
  margin-left: auto;
  margin-right: 0;
}

.nav-list-container {
  padding: 0.5rem;
  overflow-y: auto;
  flex-grow: 1;
}
.nav-list { list-style: none; padding: 0; margin: 0; }
.nav-link { display: block; padding: 8px 12px; color: var(--text-secondary); text-decoration: none; border-radius: 4px; font-size: 14px; transition: background-color 0.2s, color 0.2s; }
.nav-link:hover { background-color: var(--bg-tertiary); color: var(--text-primary); }
.nav-link.is-active { background-color: var(--accent-color-muted); color: var(--text-primary); font-weight: 500; }
</style>