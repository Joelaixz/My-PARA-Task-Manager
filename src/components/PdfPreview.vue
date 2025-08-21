<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFViewer, EventBus, PDFLinkService } from 'pdfjs-dist/web/pdf_viewer.mjs';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker?url';

const props = defineProps<{
  content: {
    base64: string;
    mimeType: string;
  }
}>();

const pdfContainerRef = ref<HTMLDivElement | null>(null);
const viewerRef = ref<HTMLDivElement | null>(null);
let pdfViewer: PDFViewer | null = null;
let eventBus: EventBus | null = null;

const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const scale = ref(1);

const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
});

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function base64ToUint8Array(): Uint8Array {
  const binaryString = atob(props.content.base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function handleContextMenu(event: MouseEvent) {
  const selection = window.getSelection();
  if (selection && selection.toString().length > 0) {
    event.preventDefault();
    contextMenu.value.show = true;
    contextMenu.value.x = event.clientX;
    contextMenu.value.y = event.clientY;
  }
}

function closeContextMenu() {
  contextMenu.value.show = false;
}

function executeCopy() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    closeContextMenu();
    return;
  }

  let pureText = '';
  for (let i = 0; i < selection.rangeCount; i++) {
    pureText += selection.getRangeAt(i).cloneContents().textContent || '';
  }
  
  if (pureText.length === 0) {
    closeContextMenu();
    return;
  }

  const cleanedText = pureText.replace(/\s+/g, ' ');

  try {
    window.ipcRenderer.copyTextToClipboard(cleanedText);
  } catch (error) {
    console.error('透過 IPC 複製文字失敗:', error);
  }

  closeContextMenu();
}

// --- 1. 新增點：建立一個給 Ctrl+C 使用的鍵盤事件處理函式 ---
function handleKeyDown(event: KeyboardEvent) {
  // 檢查是否為 Ctrl+C (Windows/Linux) 或 Cmd+C (Mac)
  if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
    const selection = window.getSelection();
    // 確保選取範圍是在我們的 PDF 檢視器內部
    if (selection && viewerRef.value?.contains(selection.anchorNode)) {
      event.preventDefault();
      executeCopy(); // 呼叫與右鍵選單相同的複製函式
    }
  }
}

async function loadAndRenderPdf() {
  if (!viewerRef.value || !pdfContainerRef.value) return;
  isLoading.value = true;
  errorMessage.value = null;

  if (pdfViewer) {
    pdfViewer.cleanup();
    pdfViewer.setDocument(null as any);
  }
  try {
    const pdfData = base64ToUint8Array();
    const pdfDocument = await pdfjsLib.getDocument({ data: pdfData }).promise;
    eventBus = new EventBus();
    const linkService = new PDFLinkService({ eventBus });
    pdfViewer = new PDFViewer({
      container: pdfContainerRef.value,
      viewer: viewerRef.value,
      eventBus,
      linkService,
      textLayerMode: 2,
      annotationMode: 2,
    });
    linkService.setViewer(pdfViewer);
    pdfViewer.setDocument(pdfDocument);
    eventBus.on('pagesinit', () => {
      isLoading.value = false;
      pdfViewer!.currentScaleValue = String(scale.value);
    });
  } catch (error: any) {
    console.error('Error loading PDF:', error);
    errorMessage.value = `載入 PDF 時發生錯誤: ${error.message || '未知錯誤'}`;
    isLoading.value = false;
  }
}

function updateZoom() {
  if (pdfViewer) {
    pdfViewer.currentScaleValue = String(scale.value);
  }
}
function zoomIn() {
  scale.value = parseFloat((scale.value + 0.1).toFixed(2));
}
function zoomOut() {
  if (scale.value > 0.2) {
    scale.value = parseFloat((scale.value - 0.1).toFixed(2));
  }
}

// --- 2. 修改點：綁定和解綁 keydown 事件監聽器 ---
onMounted(() => {
  loadAndRenderPdf();
  window.addEventListener('click', closeContextMenu);
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('click', closeContextMenu);
  window.removeEventListener('keydown', handleKeyDown);
  pdfViewer?.cleanup();
})

watch(() => props.content, loadAndRenderPdf, { deep: true });
watch(scale, updateZoom);

</script>

<template>
  <div class="pdf-preview-container">
    <div v-if="isLoading" class="feedback-panel">
      <p>正在渲染 PDF...</p>
    </div>
    <div v-if="errorMessage" class="feedback-panel error">
      <p>{{ errorMessage }}</p>
    </div>
    
    <div 
      ref="pdfContainerRef" 
      class="pdf-host-container"
      @contextmenu="handleContextMenu"
    >
      <div ref="viewerRef" class="pdfViewer"></div>
    </div>

    <div 
      v-if="contextMenu.show" 
      class="context-menu"
      :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
      @click.stop
    >
      <button @click="executeCopy">複製</button>
    </div>

    <div class="zoom-controls">
      <button @click="zoomOut" title="縮小">-</button>
      <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
      <button @click="zoomIn" title="放大">+</button>
    </div>
  </div>
</template>

<style scoped>
/* (樣式保持不變) */
.pdf-preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.pdf-host-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
}

.pdf-host-container :deep(.pdfViewer .page) {
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  margin-bottom: 1rem;
}

.feedback-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--text-secondary);
  font-size: 1rem;
  z-index: 10;
  background-color: var(--bg-primary);
}

.feedback-panel.error {
  color: #f87171;
  padding: 2rem;
  text-align: center;
  white-space: pre-wrap;
  word-break: break-all;
}

.context-menu {
  position: fixed;
  z-index: 1000;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 4px;
}

.context-menu button {
  display: block;
  width: 100%;
  background: none;
  border: none;
  color: var(--text-primary);
  padding: 8px 16px;
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
}

.context-menu button:hover {
  background-color: var(--accent-color);
  color: var(--text-accent-contrast);
}

.zoom-controls {
  position: fixed;
  bottom: 20px;
  right: 30px;
  background-color: rgba(45, 45, 45, 0.8);
  backdrop-filter: blur(5px);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  padding: 4px;
  z-index: 100;
  user-select: none;
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
  min-width: 50px;
  text-align: center;
}
</style>