// 檔案位置: src/components/sidebar/FileExplorer.vue
<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import path from 'path-browserify'
import FileTree from './FileTree.vue'
import SidebarHeader from './SidebarHeader.vue'
import InputDialog from './InputDialog.vue'
import { useFileStore, useMainStore, type SidebarMode } from '../../store'

const router = useRouter()
const fileStore = useFileStore()
const mainStore = useMainStore()

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
}

const isDialogVisible = ref(false)
const dialogTitle = ref('')
const dialogInitialValue = ref('')
const showExtensionDialog = ref(false)
const fileExtensions = ref(['.md', '.txt'])
const dialogMode = ref<'create-file' | 'create-folder' | 'rename' | null>(null);
const entryForOperation = ref<FileEntry | null>(null);
// --- 1. 新增點：專門用來儲存建立操作的上下文路徑 ---
const creationParentDir = ref<string | null>(null);

const fileList = ref<FileEntry[]>([])
const selectedFolderName = ref('檔案總管')
const rootPath = ref<string | null>(null)
const isLoading = ref(false)

const emit = defineEmits(['toggle-collapse']);

async function refreshFileTree() {
  if (!rootPath.value) return;
  isLoading.value = true;
  try {
    const result = await window.ipcRenderer.getFiles(rootPath.value);
    if (result) {
      fileList.value = result.files;
    } else {
      fileList.value = [];
      rootPath.value = null;
      selectedFolderName.value = '請選擇資料夾';
    }
  } catch (error) {
    console.error('Failed to refresh file tree:', error);
  } finally {
    isLoading.value = false;
  }
}

async function handleLoadFiles(directoryPath?: string) {
  isLoading.value = true
  if (!directoryPath) {
    fileList.value = []
    rootPath.value = null
  }
  
  fileStore.collapseAllFolders();

  try {
    const result = await window.ipcRenderer.getFiles(directoryPath)
    if (result) {
      fileList.value = result.files;
      selectedFolderName.value = result.folderName;
      rootPath.value = result.rootPath;

      const modeToUpdate = mainStore.sidebarMode === 'files' 
        ? mainStore.previousSidebarMode 
        : mainStore.sidebarMode;
        
      if (!directoryPath && modeToUpdate) {
        await window.ipcRenderer.setLastPathForMode(modeToUpdate, result.rootPath);
        await window.ipcRenderer.setLastFileForMode(modeToUpdate, ''); 
        fileStore.selectFile(null);
      }

      if (rootPath.value) {
        fileStore.selectFolder(rootPath.value);
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

async function loadMode(mode: SidebarMode | null) {
  if (!mode || mode === 'files') return;
  
  const lastFolderPath = await window.ipcRenderer.getLastPathForMode(mode);

  if (lastFolderPath) {
    await handleLoadFiles(lastFolderPath);
    
    const lastFilePath = await window.ipcRenderer.getLastFileForMode(mode);
    if (lastFilePath) {
      fileStore.selectFile(lastFilePath);
      fileStore.ensurePathIsExpanded(lastFilePath);
    } else {
      fileStore.selectFile(null);
    }
  } else {
    fileList.value = [];
    rootPath.value = null;
    selectedFolderName.value = '請選擇資料夾';
    fileStore.selectFile(null);
  }
}

watch(() => mainStore.sidebarMode, (newMode) => {
  loadMode(newMode);
}, { immediate: true });

// --- 2. 修正點：在觸發時就「鎖定」父目錄 ---
function triggerCreateNewItem(type: 'file' | 'folder') {
  if (!rootPath.value) {
    alert('請先選擇一個根資料夾。');
    return;
  }
  
  // 核心修正：在打開對話框之前，就根據當前狀態決定好父目錄
  let parentDir: string | null = null;
  const selectedFile = fileStore.selectedFilePath;
  const selectedFolder = fileStore.selectedFolderPath;
  
  // 判斷邏輯：如果選中了檔案，父目錄就是該檔案的目錄。否則，就是選中的資料夾。最後才是根目錄。
  if (selectedFile) {
      parentDir = path.dirname(selectedFile);
  } else if (selectedFolder) {
      parentDir = selectedFolder;
  } else {
      parentDir = rootPath.value;
  }
  creationParentDir.value = parentDir; // 將確定的路徑儲存起來

  entryForOperation.value = null;
  dialogInitialValue.value = '';
  if (type === 'file') {
    dialogMode.value = 'create-file';
    dialogTitle.value = '建立新檔案';
    showExtensionDialog.value = true;
  } else {
    dialogMode.value = 'create-folder';
    dialogTitle.value = '建立新資料夾';
    showExtensionDialog.value = false;
  }
  isDialogVisible.value = true;
}

function handleRenameRequest(entry: FileEntry) {
  entryForOperation.value = entry;
  dialogMode.value = 'rename';
  dialogTitle.value = `重新命名 "${entry.name}"`;
  dialogInitialValue.value = entry.name;
  showExtensionDialog.value = false;
  isDialogVisible.value = true;
}

async function handleDeleteRequest(entry: FileEntry) {
  const itemType = entry.isDirectory ? '資料夾' : '檔案';
  if (window.confirm(`確定要刪除${itemType} "${entry.name}" 嗎？此操作無法復原。`)) {
    isLoading.value = true;
    try {
      const success = await window.ipcRenderer.deleteEntry(entry.path);
      if (success) {
        if (fileStore.selectedFilePath === entry.path) fileStore.selectFile(null);
        if (fileStore.selectedFolderPath === entry.path) fileStore.selectFolder(null);
        await refreshFileTree(); 
      } else {
        alert('刪除失敗，請檢查檔案權限或檔案是否被佔用。');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('刪除時發生錯誤。');
    } finally {
      isLoading.value = false;
    }
  }
}

async function handleDialogConfirm(newName: string) {
  if (!newName || !rootPath.value) return;
  
  // --- 3. 修正點：直接使用之前「鎖定」的父目錄 ---
  if (dialogMode.value === 'create-file' || dialogMode.value === 'create-folder') {
    const parentDir = creationParentDir.value;

    if (!parentDir) {
        alert('無法確定建立位置。');
        return;
    }

    isLoading.value = true;
    try {
        const createFunction = dialogMode.value === 'create-file' ? window.ipcRenderer.createFile : window.ipcRenderer.createFolder;
        const result = await createFunction(parentDir, newName, rootPath.value);
        if (result) {
            await refreshFileTree();
            await nextTick();
            fileStore.ensurePathIsExpanded(result.newPath);
            if (dialogMode.value === 'create-file') {
                fileStore.setPendingEdit();
                fileStore.selectFile(result.newPath);
            } else {
                fileStore.selectFolder(result.newPath);
            }
        } else {
            alert(`建立失敗，可能是名稱重複、無效或權限不足。`);
        }
    } catch (error) {
        console.error(`Error during create dialog confirm:`, error);
        alert(`建立時發生錯誤。`);
    } finally {
        isLoading.value = false;
    }

  } else if (dialogMode.value === 'rename' && entryForOperation.value) {
    isLoading.value = true;
    try {
      const resultPath = await window.ipcRenderer.renameEntry(entryForOperation.value.path, newName);
      if (resultPath) {
        if (fileStore.selectedFilePath === entryForOperation.value.path) {
            fileStore.selectFile(resultPath);
        }
        await refreshFileTree();
      } else {
        alert('重新命名失敗。');
      }
    } catch (error) {
      console.error(`Error during rename dialog confirm:`, error);
      alert(`重新命名時發生錯誤。`);
    } finally {
      isLoading.value = false;
    }
  }

  dialogMode.value = null;
  entryForOperation.value = null;
  creationParentDir.value = null; // 清理上下文
}

watch(() => fileStore.selectedFilePath, (newPath) => {
  if (newPath && router.currentRoute.value.path !== '/view') {
    router.push('/view')
  }
})
</script>

<template>
  <div class="file-explorer-container">
    <SidebarHeader
      :folder-name="selectedFolderName"
      :is-loading="isLoading"
      @load-files="handleLoadFiles()"
      @toggle-collapse="$emit('toggle-collapse')"
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
        @rename="handleRenameRequest"
        @delete="handleDeleteRequest"
      />
    </div>

    <InputDialog
      v-model="isDialogVisible"
      :title="dialogTitle"
      :initial-value="dialogInitialValue"
      :show-extension-select="showExtensionDialog"
      :extensions="fileExtensions"
      @confirm="handleDialogConfirm"
    />
  </div>
</template>

<style scoped>
.file-explorer-container {
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
</style>