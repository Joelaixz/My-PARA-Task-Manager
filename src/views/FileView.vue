<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useFileStore } from '../store'
import MarkdownPreview from '../components/MarkdownPreview.vue'
import ImagePreview from '../components/ImagePreview.vue'
import PdfPreview from '../components/PdfPreview.vue'

// 目的：用一個物件來儲存從主行程獲取的完整檔案資訊。
interface FileData {
  content: string;    // 文字內容或 Base64 字串
  isBinary: boolean;
  mimeType?: string;
  extension: string;
}

const fileStore = useFileStore()
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const currentFileData = ref<FileData | null>(null)

// 目的：根據給定的檔案路徑，透過 IPC 通道非同步讀取檔案內容。
async function loadFileContent(filePath: string) {
  isLoading.value = true
  currentFileData.value = null
  errorMessage.value = null
  try {
    const result = await window.ipcRenderer.readFile(filePath)
    if (result) {
      const extension = filePath.split('.').pop()?.toLowerCase() || ''
      currentFileData.value = { ...result, extension }
    } else {
      errorMessage.value = `無法讀取檔案內容，檔案可能已損毀或權限不足：${filePath}`
    }
  } catch (error) {
    console.error('IPC call to read-file failed:', error)
    errorMessage.value = `讀取檔案時發生錯誤：${filePath}`
  } finally {
    isLoading.value = false
  }
}

// 目的：根據當前檔案的副檔名，決定要使用哪個預覽元件。
const activePreviewComponent = computed(() => {
  if (!currentFileData.value) return null

  const ext = currentFileData.value.extension
  if (['md', 'txt'].includes(ext)) {
    return MarkdownPreview
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
    return ImagePreview
  }
  if (ext === 'pdf') {
    return PdfPreview
  }
  return null
})

// 監聽 Pinia Store 中 selectedFilePath 的變化。
watch(() => fileStore.selectedFilePath, (newPath) => {
  if (newPath) {
    loadFileContent(newPath)
  } else {
    currentFileData.value = null
    errorMessage.value = null
    isLoading.value = false
  }
})

// 確保當元件第一次被掛載時，也能正確載入內容。
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
    
    <div v-else-if="currentFileData && activePreviewComponent" class="preview-wrapper">
      <MarkdownPreview
        v-if="!currentFileData.isBinary && activePreviewComponent === MarkdownPreview"
        :content="currentFileData.content"
      />
      <ImagePreview
        v-else-if="currentFileData.isBinary && activePreviewComponent === ImagePreview && currentFileData.mimeType"
        :content="{ base64: currentFileData.content, mimeType: currentFileData.mimeType }"
      />
      <PdfPreview
        v-else-if="currentFileData.isBinary && activePreviewComponent === PdfPreview && currentFileData.mimeType"
        :content="{ base64: currentFileData.content, mimeType: currentFileData.mimeType }"
      />
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

.preview-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
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