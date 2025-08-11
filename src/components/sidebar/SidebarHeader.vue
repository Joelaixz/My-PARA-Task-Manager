<script setup lang="ts">
import { computed } from 'vue'; // 1. 匯入 computed
import { useMainStore } from '../../store';

const mainStore = useMainStore();

// 2. 建立 computed 屬性來翻譯模式名稱
const previousModeText = computed(() => {
  switch (mainStore.previousSidebarMode) {
    case 'personal':
      return '個人';
    case 'projects':
      return '專案';
    case 'areas':
      return '領域';
    case 'resources':
      return '資源';
    case 'archives':
      return '封存';
    default:
      return ''; // 如果沒有上一個模式，則返回空字串
  }
});

defineProps<{
  folderName: string;
  isLoading: boolean;
}>()

const emit = defineEmits([
  'load-files', 
  'toggle-collapse',
  'create-file',
  'create-folder'
])

function onLoadFiles() {
  emit('load-files')
}

function onToggleCollapse() {
  emit('toggle-collapse')
}

function onCreateFile() {
  emit('create-file')
}

function onCreateFolder() {
  emit('create-folder')
}

function restorePreviousMode() {
  mainStore.restorePreviousSidebarMode();
}
</script>

<template>
  <div class="l2-header">
    <div class="header-title-wrapper">
      <span class="header-icon">📁</span>
      <span class="header-title" :title="folderName">{{ folderName }}</span>
    </div>
    
    <div class="header-actions">
      <button 
        v-if="mainStore.previousSidebarMode" 
        @click="restorePreviousMode" 
        :title="`返回${previousModeText}模式`"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
        </svg>
      </button>

      <button @click="onCreateFile" title="新增檔案">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 6.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V11a.5.5 0 0 1-1 0V9.5H6a.5.5 0 0 1 0-1h1.5V7a.5.5 0 0 1 .5-.5z"/>
          <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
        </svg>
      </button>
      <button @click="onCreateFolder" title="新增資料夾">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="m.5 3 .04.87a1.99 1.99 0 0 0-.342 1.311l.637 7A2 2 0 0 0 2.826 14H9V5.5a.5.5 0 0 1 .5-.5H15v-.54L14.04.87A2 2 0 0 0 12.131 0H2.5A1.5 1.5 0 0 0 1 1.5v1.54.5zM15 6h-4.5a.5.5 0 0 0-.5.5V14h3.777a2 2 0 0 0 1.992-1.854l.637-7A2 2 0 0 0 15 3.5V6zM8 8.5a.5.5 0 0 0-1 0V10H5.5a.5.5 0 0 0 0 1H7v1.5a.5.5 0 0 0 1 0V11h1.5a.5.5 0 0 0 0-1H8V8.5z"/>
        </svg>
      </button>
      <button @click="onLoadFiles" :disabled="isLoading" title="重新載入資料夾">
         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
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
</template>

<style scoped>
/* 樣式保持不變 */
.l2-header {
  padding: 0.5rem 1rem;
  height: auto;
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
.header-actions button:disabled {
  color: #666;
  cursor: not-allowed;
  background-color: transparent;
}
.header-actions .collapse-button {
  margin-left: auto;
  margin-right: 0;
}
.header-actions button svg { opacity: 0.8; }
.header-actions button:hover svg { opacity: 1; }
.header-actions button:disabled svg { opacity: 0.4; }
</style>