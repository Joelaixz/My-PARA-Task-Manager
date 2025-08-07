<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker?url'

const props = defineProps<{
  content: {
    base64: string;
    mimeType: string;
  }
}>()

// --- Refs ---
const pdfContainerRef = ref<HTMLDivElement | null>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
// --- 1. 新增：用於控制縮放比例的響應式變數 ---
const scale = ref(1.5) // 預設放大 150%

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// --- 2. 重構：讓 renderPdf 函式可以被重複呼叫 ---
//    我們將 PDF 文件物件儲存起來，避免重複解析。
let pdfDocument: pdfjsLib.PDFDocumentProxy | null = null;

async function renderAllPages() {
  if (!pdfContainerRef.value || !pdfDocument) return;

  isLoading.value = true;
  pdfContainerRef.value.innerHTML = ''; // 清空舊的渲染

  const pixelRatio = window.devicePixelRatio || 1;
  const renderScale = scale.value * pixelRatio;

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: renderScale });
    
    const canvas = document.createElement('canvas');
    canvas.className = 'pdf-page-canvas';
    const context = canvas.getContext('2d');
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.style.height = `${viewport.height / pixelRatio}px`;
    canvas.style.width = `${viewport.width / pixelRatio}px`;

    pdfContainerRef.value.appendChild(canvas);

    await page.render({
      canvasContext: context,
      canvas: canvas,
      viewport: viewport
    }).promise;
  }
  isLoading.value = false;
}

async function loadAndRenderPdf() {
  if (!props.content.base64) return;
  
  isLoading.value = true;
  errorMessage.value = null;
  pdfDocument = null; // 重置

  try {
    const pdfData = base64ToUint8Array(props.content.base64);
    pdfDocument = await pdfjsLib.getDocument({ data: pdfData }).promise;
    await renderAllPages(); // 首次渲染
  } catch (error: any) {
    console.error('Error loading PDF:', error);
    errorMessage.value = `載入 PDF 時發生錯誤: ${error.message || '未知錯誤'}`;
    isLoading.value = false;
  }
}

// --- 3. 新增：縮放控制函式 ---
function zoomIn() {
  scale.value = parseFloat((scale.value + 0.1).toFixed(2));
}

function zoomOut() {
  // 避免縮太小
  if (scale.value > 0.2) {
    scale.value = parseFloat((scale.value - 0.1).toFixed(2));
  }
}

// --- 4. 修改：監聽 props 和 scale 的變化 ---
onMounted(loadAndRenderPdf);
// 當檔案內容改變時，重新載入並渲染
watch(() => props.content, loadAndRenderPdf, { deep: true });
// 當縮放比例改變時，僅重新渲染頁面
watch(scale, renderAllPages);

</script>

<template>
  <div class="pdf-preview-container">
    <div v-if="isLoading" class="feedback-panel">
      <p>正在渲染 PDF...</p>
    </div>
    <div v-else-if="errorMessage" class="feedback-panel error">
      <p>{{ errorMessage }}</p>
    </div>
    <div ref="pdfContainerRef" class="pdf-pages-host"></div>

    <div class="zoom-controls">
      <button @click="zoomOut" title="縮小">-</button>
      <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
      <button @click="zoomIn" title="放大">+</button>
    </div>
  </div>
</template>

<style scoped>
.pdf-preview-container {
  /* 新增 position: relative; 讓絕對定位的子元素有所依據 */
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 1rem 0;
  box-sizing: border-box;
}

.pdf-pages-host {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.pdf-page-canvas {
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.feedback-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #d4d4d4;
  font-size: 1rem;
}

.feedback-panel.error {
  color: #f87171;
  padding: 2rem;
  text-align: center;
  white-space: pre-wrap;
  word-break: break-all;
}

/* --- 6. 新增：縮放控制面板的樣式 --- */
.zoom-controls {
  position: fixed; /* 固定在視窗右下角 */
  bottom: 20px;
  right: 30px;
  background-color: rgba(45, 45, 45, 0.8); /* 半透明背景 */
  backdrop-filter: blur(5px); /* 毛玻璃效果 */
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  padding: 4px;
  z-index: 100;
  user-select: none; /* 防止選取文字 */
}

.zoom-controls button {
  background-color: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  width: 36px;
  height: 36px;
  line-height: 36px;
  text-align: center;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.zoom-controls button:hover {
  background-color: var(--bg-tertiary);
}

.zoom-level {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  padding: 0 12px;
  min-width: 50px; /* 確保寬度不會因數字變化而跳動 */
  text-align: center;
}
</style>