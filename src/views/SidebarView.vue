<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import FileTree from '../components/FileTree.vue'
// --- 1. 匯入 SidebarHeader 元件 ---
import SidebarHeader from '../components/SidebarHeader.vue'
import { useFileStore } from '../store'

const router = useRouter()
const fileStore = useFileStore()

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
  isExpanded?: boolean;
}

const fileList = ref<FileEntry[]>([])
const selectedFolderName = ref('檔案總管')
const isLoading = ref(false)
const isCollapsed = ref(false)
const sidebarWidth = ref(240)
const isResizing = ref(false)

function startResize(event: MouseEvent) {
  event.preventDefault()
  isResizing.value = true
  document.body.style.cursor = 'col-resize'
  window.addEventListener('mousemove', handleResizing)
  window.addEventListener('mouseup', stopResize)
}

function handleResizing(event: MouseEvent) {
  if (!isResizing.value) return
  const newWidth = event.clientX - 60 
  if (newWidth >= 180 && newWidth <= 500) {
    sidebarWidth.value = newWidth
  }
}

function stopResize() {
  isResizing.value = false
  document.body.style.cursor = ''
  window.removeEventListener('mousemove', handleResizing)
  window.removeEventListener('mouseup', stopResize)
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

const sidebarStyle = computed(() => ({
  width: isCollapsed.value ? '0px' : `${sidebarWidth.value}px`,
  padding: isCollapsed.value ? '0' : undefined,
  borderRight: isCollapsed.value ? 'none' : undefined,
  overflow: 'hidden'
}))

async function handleLoadFiles() {
  isLoading.value = true
  fileList.value = []
  try {
    const result = await window.ipcRenderer.getFiles()
    if (result) {
      const addExpansionState = (entries: FileEntry[]): FileEntry[] => {
        return entries.map(entry => {
          if (entry.isDirectory) {
            return { ...entry, isExpanded: false, children: entry.children ? addExpansionState(entry.children) : [] };
          }
          return entry;
        });
      };
      fileList.value = addExpansionState(result.files);
      selectedFolderName.value = result.folderName;
    } else {
      selectedFolderName.value = '檔案總管';
    }
  } catch (error) {
    console.error('Failed to get files from main process:', error)
    selectedFolderName.value = '檔案總管'
  } finally {
    isLoading.value = false
  }
}

// --- 2. 新增：處理來自 SidebarHeader 的新增檔案/資料夾事件 ---
// 目的：為未來的功能預留掛載點。
function handleCreateFile() {
  // 未來將在此處實現新增檔案的邏輯
  console.log('Received create-file event in SidebarView');
  alert('新增檔案功能待開發');
}

function handleCreateFolder() {
  // 未來將在此處實現新增資料夾的邏輯
  console.log('Received create-folder event in SidebarView');
  alert('新增資料夾功能待開發');
}

watch(() => fileStore.selectedFilePath, (newPath) => {
  if (newPath && router.currentRoute.value.path !== '/view') {
    router.push('/view')
  }
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleResizing)
  window.removeEventListener('mouseup', stopResize)
})
</script>

<template>
  <div class="sidebar-view-wrapper" :class="{ 'is-resizing': isResizing }">
    <button v-if="isCollapsed" @click="toggleCollapse" class="expand-button">
      &gt;
    </button>

    <aside class="l2-sidebar" :style="sidebarStyle">
      <div v-if="!isCollapsed" class="sidebar-content">
        
        <SidebarHeader
          :folder-name="selectedFolderName"
          :is-loading="isLoading"
          @load-files="handleLoadFiles"
          @toggle-collapse="toggleCollapse"
          @create-file="handleCreateFile"
          @create-folder="handleCreateFolder"
        />
        
        <div class="file-list-container">
          <div v-if="isLoading" class="feedback-message">讀取中...</div>
          <div v-else-if="fileList.length === 0" class="feedback-message">
            點擊 📂 圖示選擇資料夾
          </div>
          <FileTree 
            v-else 
            :entries="fileList" 
          />
        </div>
      </div>
    </aside>

    <div v-if="!isCollapsed" @mousedown="startResize" class="resizer"></div>
  </div>
</template>

<style scoped>
/* 樣式保持不變，因為結構的 class 名稱沒有改變 */
.sidebar-view-wrapper {
  display: flex;
  height: 100%;
  position: relative;
}
.sidebar-view-wrapper.is-resizing {
  user-select: none;
}

.expand-button {
  position: absolute;
  left: 0;
  top: 40px;
  z-index: 20;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-left: none;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  cursor: pointer;
  padding: 8px 4px;
  font-family: monospace;
}
.expand-button:hover {
  background: var(--accent-color);
}

.l2-sidebar {
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
  height: 100%;
}
.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* l2-header 的樣式已經移至 SidebarHeader.vue，此處可以移除 */

.file-list-container {
  padding: 0.5rem;
  overflow-y: auto;
  flex-grow: 1;
}
.feedback-message {
  padding: 1rem;
  color: var(--text-secondary);
  font-size: 14px;
  text-align: center;
}
.resizer {
  width: 5px;
  cursor: col-resize;
  background-color: transparent;
  flex-shrink: 0;
  position: relative;
  z-index: 5;
  transition: background-color 0.2s;
}
.resizer:hover,
.sidebar-view-wrapper.is-resizing .resizer {
  background-color: var(--accent-color);
}
</style>