// 檔案位置: src/components/sidebar/FileExplorer.vue
<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import FileTree from './FileTree.vue'
import SidebarHeader from './SidebarHeader.vue'
import InputDialog from './InputDialog.vue'
// --- 1. 修改點：同時匯入 useMainStore ---
import { useFileStore, useMainStore } from '../../store'

const router = useRouter()
const fileStore = useFileStore()
// --- 2. 新增點：取得 mainStore 的實例 ---
// 目的：我們需要 mainStore 來得知是從哪個模式（例如 'personal'）切換到檔案總管的。
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

// --- 3. 修改點：調整 handleLoadFiles 函式 ---
// 目的：在使用者手動選擇新資料夾後，儲存該路徑。
async function handleLoadFiles(directoryPath?: string) {
  isLoading.value = true
  // 僅在手動選擇資料夾時清空現有狀態
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

      // 如果 directoryPath 是 undefined，代表是使用者透過對話框選擇的
      // 這時我們需要儲存這個新路徑
      if (!directoryPath && mainStore.previousSidebarMode) {
        // 為什麼：將新選擇的路徑與當前的模式關聯並儲存，
        //         這樣下次從同一個模式切換回來時，就能直接載入。
        await window.ipcRenderer.setLastPathForMode(mainStore.previousSidebarMode, result.rootPath);
      }

      // 確保根目錄總是展開的
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

// --- 4. 新增點：在元件掛載時自動載入最後路徑 ---
onMounted(async () => {
  // 為什麼：這是實現「記憶功能」的入口。當元件第一次顯示時，
  //         我們檢查是從哪個模式切換過來的。
  if (mainStore.previousSidebarMode) {
    const lastPath = await window.ipcRenderer.getLastPathForMode(mainStore.previousSidebarMode);
    // 如果資料庫中存在該模式的路徑，就自動載入它。
    if (lastPath) {
      await handleLoadFiles(lastPath);
    }
  }
});


// 處理建立新項目(檔案/資料夾)的邏輯 (保持不變)
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

// 處理彈出對話框確認後的邏輯 (保持不變)
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

// 監聽選中檔案的變化以觸發路由跳轉 (保持不變)
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