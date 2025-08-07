<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { marked } from 'marked';
import { useFileStore } from '../store';
import MarkdownEditor from './MarkdownEditor.vue';

const props = defineProps<{
  content: string | null;
}>();
const fileStore = useFileStore();

const isEditing = ref(false);
// --- 1. 新增：控制編輯器是否展開的狀態 ---
const isEditorExpanded = ref(false);
const editableContent = ref('');
const viewContent = ref(props.content || '');
const isSaving = ref(false);
let debounceTimer: number | null = null;

const renderedHtml = computed(() => {
  const source = isEditing.value ? editableContent.value : viewContent.value;
  if (typeof source === 'string') {
    return marked(source);
  }
  return '';
});

function toggleEditMode() {
  isEditing.value = !isEditing.value;
  if (isEditing.value) {
    editableContent.value = viewContent.value;
  } else {
    viewContent.value = editableContent.value;
    isEditorExpanded.value = false; // 退出編輯模式時，重置展開狀態
  }
}

// --- 2. 新增：切換編輯器展開狀態的函式 ---
function toggleEditorExpansion() {
  isEditorExpanded.value = !isEditorExpanded.value;
}

async function saveContent(filePath: string, content: string) {
  isSaving.value = true;
  try {
    const success = await window.ipcRenderer.saveFile(filePath, content);
    if (success) {
      viewContent.value = content;
    }
  } catch (error) {
    console.error('Auto-save failed:', error);
  } finally {
    isSaving.value = false;
    debounceTimer = null;
  }
}

function debouncedSave(filePath: string, content: string) {
  isSaving.value = true;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = window.setTimeout(() => {
    saveContent(filePath, content);
  }, 1500);
}

watch(editableContent, (newContent) => {
  if (isEditing.value && fileStore.selectedFilePath) {
    debouncedSave(fileStore.selectedFilePath, newContent);
  }
});

watch(() => props.content, (newContent) => {
  isEditing.value = false;
  isEditorExpanded.value = false; // 切換檔案時，重置展開狀態
  viewContent.value = newContent || '';
});
</script>

<template>
  <div class="markdown-container">
    <div class="top-controls">
      <span v-if="isSaving" class="save-status">儲存中...</span>
      <button v-if="isEditing" @click="toggleEditorExpansion" class="edit-button" :title="isEditorExpanded ? '收合' : '展開'">
        <svg v-if="!isEditorExpanded" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H3v6M15 21h6v-6M3 3l7 7M21 21l-7-7"/></svg>
      </button>
      <button @click="toggleEditMode" class="edit-button">
        {{ isEditing ? '完成' : '編輯' }}
      </button>
    </div>

    <div v-if="isEditing" class="split-view" :class="{ 'editor-expanded': isEditorExpanded }">
      <div class="pane preview-pane">
        <div class="markdown-body" v-html="renderedHtml"></div>
      </div>
      <div class="pane editor-pane">
        <MarkdownEditor v-model="editableContent" />
      </div>
    </div>
    
    <div v-else class="preview-pane-single">
      <div class="markdown-body" v-html="renderedHtml"></div>
    </div>
  </div>
</template>

<style scoped>
.markdown-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.top-controls {
  position: fixed; 
  top: 10px;
  right: 30px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 0.5rem; /* 縮小按鈕間距 */
}

.split-view {
  display: flex;
  width: 100%;
  flex-grow: 1;
  overflow: hidden; 
}

.pane {
  width: 50%;
  height: 100%;
  overflow-y: auto;
  /* 5. 新增：加入過渡動畫讓版面切換更平滑 */
  transition: width 0.3s ease-in-out;
}

.editor-pane {
  border-left: 1px solid var(--border-color);
}

/* 6. 新增：展開模式下的核心樣式 */
.split-view.editor-expanded .preview-pane {
  width: 0; /* 預覽區寬度變為 0，從而隱藏 */
  /* 增加 padding: 0; 避免內容在寬度為 0 時還造成影響 */
  padding: 0;
  border: none;
}
.split-view.editor-expanded .editor-pane {
  width: 100%; /* 編輯區寬度變為 100%，佔滿全部空間 */
  border-left: none; /* 隱藏左側邊框 */
}


.preview-pane-single {
  flex-grow: 1;
  overflow-y: auto;
}

.preview-pane-single,
.pane.preview-pane {
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) var(--bg-secondary);
}
.preview-pane-single::-webkit-scrollbar,
.pane.preview-pane::-webkit-scrollbar {
  width: 8px;
}
.preview-pane-single::-webkit-scrollbar-track,
.pane.preview-pane::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}
.preview-pane-single::-webkit-scrollbar-thumb,
.pane.preview-pane::-webkit-scrollbar-thumb {
  background-color: var(--border-color);
  border-radius: 4px;
}

.save-status {
  color: var(--text-secondary);
  font-size: 12px;
}

.edit-button {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  /* 讓 SVG 圖示垂直置中 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-button:hover {
  background-color: var(--accent-color);
  color: var(--text-accent-contrast);
}

.markdown-body {
  padding: 1rem 2.5rem;
  line-height: 1.7;
  color: var(--text-primary);
  word-wrap: break-word;
}

/* (後續的 .markdown-body :deep() 樣式保持不變) */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
  line-height: 1.25;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.3em;
}

.markdown-body :deep(h1) { font-size: 2em; }
.markdown-body :deep(h2) { font-size: 1.5em; }
.markdown-body :deep(h3) { font-size: 1.25em; }

.markdown-body :deep(p) {
  margin-bottom: 1rem;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 2em;
  margin-bottom: 1rem;
}

.markdown-body :deep(a) {
  color: var(--link-color);
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(blockquote) {
  margin: 0 0 1rem 0;
  padding: 0 1em;
  color: var(--text-secondary);
  border-left: 0.25em solid var(--border-color);
}

.markdown-body :deep(code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: var(--bg-secondary);
  border-radius: 4px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
}

.markdown-body :deep(pre) {
  margin-bottom: 1rem;
  padding: 1rem;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: var(--bg-secondary);
  border-radius: 6px;
}

.markdown-body :deep(pre code) {
  padding: 0;
  margin: 0;
  background-color: transparent;
  border: 0;
}

.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  margin-bottom: 1rem;
  width: 100%;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--border-color);
  padding: 0.5rem;
}

.markdown-body :deep(th) {
  background-color: var(--bg-secondary);
}
</style>