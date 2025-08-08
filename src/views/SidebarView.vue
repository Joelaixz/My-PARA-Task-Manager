<script setup lang="ts">
import { ref, computed, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import path from 'path-browserify'
import FileTree from '../components/FileTree.vue'
import SidebarHeader from '../components/SidebarHeader.vue'
import InputDialog from '../components/InputDialog.vue'
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

const isDialogVisible = ref(false)
const dialogTitle = ref('')
const showExtensionDialog = ref(false) 
const fileExtensions = ref(['.md', '.txt']) 
const creationType = ref<'file' | 'folder' | null>(null);
const currentCreateFunction = ref<(parentDir: string, name: string, rootPath: string) => Promise<{ newPath: string; files: FileEntry[] } | null>>()


const fileList = ref<FileEntry[]>([])
const selectedFolderName = ref('檔案總管')
const rootPath = ref<string | null>(null)
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

// --- 1. 修改：建立一個新的、更可靠的資料處理函式 ---
/**
 * 目的：從原始資料遞迴建立一個新的、具有完整響應式狀態的檔案樹。
 * @param entries - 從主行程接收到的原始檔案/資料夾陣列。
 * @param targetPath - (可選) 需要自動展開到的目標路徑。
 * @returns 處理後，帶有正確 isExpanded 狀態的陣列。
 */
function processTreeData(entries: FileEntry[], targetPath?: string): FileEntry[] {
  return entries.map(entry => {
    if (entry.isDirectory) {
      let isExpanded = false;
      // 如果提供了 targetPath，則檢查當前目錄是否在該路徑上
      if (targetPath && (targetPath === entry.path || targetPath.startsWith(entry.path + path.sep))) {
        isExpanded = true;
      }
      return { 
        ...entry, 
        isExpanded,
        children: entry.children ? processTreeData(entry.children, targetPath) : [] 
      };
    }
    return entry;
  });
}

async function handleLoadFiles(directoryPath?: string) {
  isLoading.value = true
  if (!directoryPath) {
    fileList.value = []
    rootPath.value = null
  }
  try {
    const result = await window.ipcRenderer.getFiles(directoryPath)
    if (result) {
      // --- 2. 使用新的函式來處理資料 ---
      fileList.value = processTreeData(result.files);
      selectedFolderName.value = result.folderName;
      rootPath.value = result.rootPath; 
      
      if (!directoryPath) {
         fileStore.selectFolder(rootPath.value);
      }
    } else if (!directoryPath) {
      selectedFolderName.value = '檔案總管';
      fileList.value = [];
      rootPath.value = null;
    }
  } catch (error) {
    console.error('Failed to get files from main process:', error)
    selectedFolderName.value = '檔案總管'
  } finally {
    isLoading.value = false
  }
}

function triggerCreateNewItem(type: 'file' | 'folder') {
  if (!rootPath.value) {
    alert('請先選擇一個根資料夾。');
    return;
  }
  
  creationType.value = type;

  if (type === 'file') {
    dialogTitle.value = '建立新檔案';
    showExtensionDialog.value = true;
    currentCreateFunction.value = window.ipcRenderer.createFile;
  } else {
    dialogTitle.value = '建立新資料夾';
    showExtensionDialog.value = false;
    currentCreateFunction.value = window.ipcRenderer.createFolder;
  }
  
  isDialogVisible.value = true;
}

async function handleDialogConfirm(newItemName: string) {
  if (!newItemName || !currentCreateFunction.value || !rootPath.value) {
    return;
  }
  
  const parentDir = fileStore.selectedFolderPath || rootPath.value;

  if (!parentDir) {
    alert('無法確定建立位置，請先選擇一個資料夾。');
    return;
  }
  
  isLoading.value = true;
  try {
    const result = await currentCreateFunction.value(parentDir, newItemName, rootPath.value);
    
    if (result) {
      // 步驟 A: 使用新函式處理資料，直接產生最終狀態
      fileList.value = processTreeData(result.files, result.newPath);

      // 步驟 B: 等待 DOM 更新完成
      await nextTick();

      // 步驟 C: 執行後續操作
      if (creationType.value === 'file') {
        fileStore.setPendingEdit();
        fileStore.selectFile(result.newPath);
      } else if (creationType.value === 'folder') {
        fileStore.selectFolder(result.newPath);
      }
    } else {
      alert(`建立失敗，可能是名稱重複、無效或權限不足。`);
    }
  } catch (error) {
    console.error(`Error creating item:`, error);
    alert(`建立時發生錯誤。`);
  } finally {
    isLoading.value = false;
    currentCreateFunction.value = undefined;
    creationType.value = null;
  }
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
          @load-files="handleLoadFiles()"
          @toggle-collapse="toggleCollapse"
          @create-file="triggerCreateNewItem('file')"
          @create-folder="triggerCreateNewItem('folder')"
        />
        
        <div class="file-list-container">
          <div v-if="isLoading" class="feedback-message">讀取中...</div>
          <div v-else-if="fileList.length === 0" class="feedback-message">
            點擊 ↻ 圖示選擇資料夾
          </div>
          <FileTree 
            v-else 
            :entries="fileList" 
          />
        </div>
      </div>
    </aside>

    <div v-if="!isCollapsed" @mousedown="startResize" class="resizer"></div>

    <InputDialog 
      v-model="isDialogVisible"
      :title="dialogTitle"
      :show-extension-select="showExtensionDialog"
      :extensions="fileExtensions"
      @confirm="handleDialogConfirm"
    />
  </div>
</template>

<style scoped>
/* 樣式保持不變 */
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
  top: 10px;
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