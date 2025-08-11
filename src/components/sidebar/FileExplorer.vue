<script setup lang="ts">
import { ref, computed, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import path from 'path-browserify'
import FileTree from './FileTree.vue'
import SidebarHeader from './SidebarHeader.vue'
import InputDialog from './InputDialog.vue'
import { useFileStore } from '../../store'

// 幾乎所有 SidebarView 的 script 內容都移到這裡
const router = useRouter()
const fileStore = useFileStore()

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

// 目的：接收來自父元件 SidebarView 的 toggleCollapse 請求
const emit = defineEmits(['toggle-collapse']);

// 處理載入檔案的邏輯
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

      if (!directoryPath) {
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

// 處理建立新項目(檔案/資料夾)的邏輯
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

// 處理彈出對話框確認後的邏輯
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

// 監聽選中檔案的變化以觸發路由跳轉
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
/* 樣式直接從 SidebarView.vue 遷移過來 */
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