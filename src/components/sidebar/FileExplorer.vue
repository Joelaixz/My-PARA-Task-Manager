// 檔案位置: src/components/sidebar/FileExplorer.vue
<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
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
const showExtensionDialog = ref(false)
const fileExtensions = ref(['.md', '.txt'])
const creationType = ref<'file' | 'folder' | null>(null);
const currentCreateFunction = ref<(parentDir: string, name: string, rootPath: string) => Promise<{ newPath: string; files: FileEntry[] } | null>>()

const fileList = ref<FileEntry[]>([])
const selectedFolderName = ref('檔案總管')
const rootPath = ref<string | null>(null)
const isLoading = ref(false)

const emit = defineEmits(['toggle-collapse']);

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

      // 1. 修改點：當使用者透過對話框手動選擇新資料夾時，更新該模式的儲存路徑。
      const modeToUpdate = mainStore.sidebarMode === 'files' 
        ? mainStore.previousSidebarMode 
        : mainStore.sidebarMode;
        
      if (!directoryPath && modeToUpdate) {
        // 為什麼：這確保了當使用者點擊「重新載入」按鈕時，新的選擇會覆蓋舊的記憶。
        await window.ipcRenderer.setLastPathForMode(modeToUpdate, result.rootPath);
        // 同時，清除該模式下「最後開啟檔案」的記錄，因為根目錄已變更。
        await window.ipcRenderer.setLastFileForMode(modeToUpdate, ''); 
        // 並且清除前端當前選中的檔案狀態。
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
      fileList.value = result.files;
      fileStore.ensurePathIsExpanded(result.newPath);
      await nextTick();
      if (creationType.value === 'file') {
        fileStore.setPendingEdit();
        fileStore.selectFile(result.newPath);
        if (mainStore.sidebarMode !== 'files') {
            await window.ipcRenderer.setLastFileForMode(mainStore.sidebarMode, result.newPath);
        }
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
      />
    </div>

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