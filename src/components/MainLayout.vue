<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import FileTree from './FileTree.vue' // <--- 1. 匯入新的 FileTree 元件

// --- 型別定義 ---
// 目的：讓此元件知道 FileEntry 的結構，以便傳遞和操作。
interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
  isExpanded?: boolean;
}

// --- 檔案總管相關狀態 ---
const fileList = ref<FileEntry[]>([])
const selectedFolderName = ref('檔案總管')
const isLoading = ref(false)

// --- 側邊欄狀態管理 ---
const isCollapsed = ref(false)
const sidebarWidth = ref(240)
const isResizing = ref(false)

// --- DOM 事件處理 ---
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

// --- IPC 通訊 ---
async function handleLoadFiles() {
  isLoading.value = true
  fileList.value = []
  try {
    const result = await window.ipcRenderer.getFiles()
    if (result) {
      const addExpansionState = (entries: FileEntry[]): FileEntry[] => {
        return entries.map(entry => {
          if (entry.isDirectory) {
            return { ...entry, isExpanded: true, children: entry.children ? addExpansionState(entry.children) : [] };
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

// --- 事件處理 ---
// 目的：這些函數現在用來回應來自 FileTree 子元件的事件。
function handleToggleFolder(folder: FileEntry) {
  if (folder.isDirectory) {
    folder.isExpanded = !folder.isExpanded;
  }
}

function handleSelectFile(file: FileEntry) {
  console.log('File selected in MainLayout:', file.path);
  // 未來可以在這裡實現開啟檔案到主編輯區的邏輯
}

onUnmounted(() => {
  window.removeEventListener('mousemove', handleResizing)
  window.removeEventListener('mouseup', stopResize)
})
</script>

<template>
  <div class="main-layout" :class="{ 'is-resizing': isResizing }">
    <nav class="l1-sidebar">
      <RouterLink to="/" title="個人">01</RouterLink>
      <RouterLink to="/projects" title="專案">02</RouterLink>
      <RouterLink to="/areas" title="領域">03</RouterLink>
      <RouterLink to="/resources" title="資源">04</RouterLink>
      <RouterLink to="/archives" title="封存">05</RouterLink>
    </nav>
    
    <button v-if="isCollapsed" @click="toggleCollapse" class="expand-button">
      &gt;
    </button>

    <aside class="l2-sidebar" :style="sidebarStyle">
      <div v-if="!isCollapsed" class="sidebar-content">
        <div class="l2-header">
          <span class="header-title" :title="selectedFolderName">{{ selectedFolderName }}</span>
          <div class="header-actions">
            <button @click="handleLoadFiles" :disabled="isLoading" title="選擇資料夾">📂</button>
            <button @click="toggleCollapse" title="收合側欄"> &lt; </button>
          </div>
        </div>
        
        <div class="file-list-container">
          <div v-if="isLoading" class="feedback-message">讀取中...</div>
          <div v-else-if="fileList.length === 0" class="feedback-message">
            點擊 📂 圖示選擇資料夾
          </div>
          <FileTree 
            v-else 
            :entries="fileList" 
            @toggle-folder="handleToggleFolder"
            @select-file="handleSelectFile"
          />
        </div>
      </div>
    </aside>

    <div v-if="!isCollapsed" @mousedown="startResize" class="resizer"></div>

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.main-layout { display: flex; height: 100vh; width: 100vw; background-color: #f0f2f5; overflow: hidden; }
.main-layout.is-resizing { user-select: none; }
.l1-sidebar { width: 60px; background-color: #2c3e50; display: flex; flex-direction: column; align-items: center; padding-top: 1rem; flex-shrink: 0; z-index: 10; }
.l1-sidebar a { color: #bdc3c7; text-decoration: none; font-size: 1.5rem; font-weight: bold; margin-bottom: 1.5rem; padding: 0.5rem; border-radius: 8px; transition: background-color 0.3s, color 0.3s; }
.l1-sidebar a:hover { background-color: #34495e; color: #ecf0f1; }
.l1-sidebar a.router-link-exact-active { background-color: #42b983; color: white; }
.expand-button { position: absolute; left: 60px; top: 10px; z-index: 20; background: #34495e; color: white; border: none; border-top-right-radius: 4px; border-bottom-right-radius: 4px; cursor: pointer; padding: 8px 4px; font-family: monospace; }
.expand-button:hover { background: #42b983; }

.l2-sidebar { background-color: #ffffff; border-right: 1px solid #dcdfe6; display: flex; flex-direction: column; flex-shrink: 0; position: relative; transition: width 0.2s ease; }
.sidebar-content { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

.l2-header { padding: 0 1rem; height: 50px; border-bottom: 1px solid #dcdfe6; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; gap: 1rem; }
.header-title { flex-grow: 1; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.header-actions { display: flex; align-items: center; flex-shrink: 0; }
.header-actions button { font-size: 16px; background: transparent; color: #606266; border: none; border-radius: 4px; cursor: pointer; padding: 4px; margin-left: 8px; }
.header-actions button:hover { background-color: #f2f6fc; }
.header-actions button:disabled { color: #c0c4cc; cursor: not-allowed; }

.file-list-container { padding: 0.5rem; overflow-y: auto; flex-grow: 1; }
.feedback-message { padding: 1rem; color: #909399; font-size: 14px; text-align: center; }

.resizer { width: 5px; cursor: col-resize; background-color: transparent; flex-shrink: 0; position: relative; z-index: 5; transition: background-color 0.2s; }
.resizer:hover, .main-layout.is-resizing .resizer { background-color: #c0c4cc; }

.main-content { flex-grow: 1; background-color: #fcfcfc; overflow-y: auto; }
</style>