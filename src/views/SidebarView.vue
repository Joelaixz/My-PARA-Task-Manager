<script setup lang="ts">
import { ref, computed, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
// `path-browserify` 仍然需要，用於選中檔案時取得父目錄路徑
import path from 'path-browserify'
import FileTree from '../components/sidebar/FileTree.vue'
import SidebarHeader from '../components/sidebar/SidebarHeader.vue'
import InputDialog from '../components/sidebar/InputDialog.vue'
import { useFileStore } from '../store'

const router = useRouter()
const fileStore = useFileStore()

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
  isExpanded?: boolean; // 這個屬性已不再被使用，但為了型別相容性暫時保留
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

// --- 1. 移除 `getExpandedPaths` 和 `processTreeData` 函式 ---
// 說明：這些管理展開狀態的邏輯現在已經被 Pinia Store 取代。

async function handleLoadFiles(directoryPath?: string) {
  isLoading.value = true
  if (!directoryPath) {
    fileList.value = []
    rootPath.value = null
  }
  
  // --- 2. 修改：在載入新目錄前，先清除 Store 中的舊展開狀態 ---
  fileStore.collapseAllFolders();

  try {
    const result = await window.ipcRenderer.getFiles(directoryPath)
    if (result) {
      // --- 3. 修改：直接賦值，不再需要 processTreeData 進行處理 ---
      fileList.value = result.files;
      selectedFolderName.value = result.folderName;
      rootPath.value = result.rootPath;

      if (!directoryPath) {
         fileStore.selectFolder(rootPath.value);
         // 預設將根目錄設為展開
         fileStore.toggleFolderExpansion(rootPath.value);
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

  // --- 4. 移除：不再需要手動保存展開狀態 ---
  isLoading.value = true;
  try {
    const result = await currentCreateFunction.value(parentDir, newItemName, rootPath.value);

    if (result) {
      // --- 5. 修改：直接用新的檔案列表更新，並呼叫 store action 來處理展開 ---
      fileList.value = result.files;
      fileStore.ensurePathIsExpanded(result.newPath);

      await nextTick();

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