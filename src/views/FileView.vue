<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useFileStore } from '../store'
import MarkdownPreview from '../components/MarkdownPreview.vue'

// --- 狀態管理 ---
const fileStore = useFileStore()
const isLoading = ref(false)
const fileContent = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

// --- 函數：載入並更新檔案內容 ---
// 目的：根據給定的檔案路徑，透過 IPC 通道非同步讀取檔案內容。
async function loadFileContent(filePath: string) {
  isLoading.value = true
  fileContent.value = null
  errorMessage.value = null
  try {
    // 呼叫我們在 preload.ts 中暴露的 readFile 函式
    const content = await window.ipcRenderer.readFile(filePath)
    if (content !== null) {
      fileContent.value = content
    } else {
      // 處理檔案讀取失敗，但 IPC 呼叫本身成功的情況
      errorMessage.value = `無法讀取檔案內容，檔案可能已損毀或權限不足：${filePath}`
    }
  } catch (error) {
    console.error('IPC call to read-file failed:', error)
    errorMessage.value = `讀取檔案時發生錯誤：${filePath}`
  } finally {
    isLoading.value = false
  }
}

// --- 監聽器 (Watcher) ---
// 目的：監聽 Pinia Store 中 selectedFilePath 的變化。
// 當使用者在檔案樹點擊新檔案時，這個監聽器就會被觸發。
watch(() => fileStore.selectedFilePath, (newPath) => {
  if (newPath) {
    loadFileContent(newPath)
  } else {
    // 如果路徑變為 null (例如，取消選中)，則清空畫面
    fileContent.value = null
    errorMessage.value = null
    isLoading.value = false
  }
}, {
  // immediate: true // 如果需要在元件首次載入時就檢查一次狀態，可以開啟此選項
})

// --- 生命週期鉤子 (Lifecycle Hook) ---
// 目的：確保當元件第一次被掛載時，如果 Store 中已經有選中的檔案路徑，
// (例如，使用者在切換路由前就已經選好檔案)，也能正確載入內容。
onMounted(() => {
  if (fileStore.selectedFilePath) {
    loadFileContent(fileStore.selectedFilePath);
  }
})
</script>

<template>
  <div class="file-view-container">
    <div v-if="isLoading" class="feedback-panel">
      <p>讀取中...</p>
    </div>
    <div v-else-if="errorMessage" class="feedback-panel error">
      <p>{{ errorMessage }}</p>
    </div>
    <div v-else-if="fileContent !== null">
      <MarkdownPreview :content="fileContent" />
    </div>
    <div v-else class="feedback-panel">
      <p>請從左側檔案總管選擇一個檔案來預覽。</p>
    </div>
  </div>
</template>

<style scoped>
.file-view-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow-y: auto;
}

.feedback-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #909399;
  font-size: 1rem;
}

.feedback-panel.error {
  color: #f56c6c;
  padding: 2rem;
  text-align: center;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>