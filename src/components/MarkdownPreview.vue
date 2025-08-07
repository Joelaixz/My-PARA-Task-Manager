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
    isEditorExpanded.value = false;
  }
}

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
  isEditorExpanded.value = false;
  viewContent.value = newContent || '';
});
</script>

<template>
  <div class="markdown-container">
    <div class="top-controls">
      <button v-if="!isEditing" @click="toggleEditMode" class="edit-button">
        編輯
      </button>
    </div>

    <div v-if="isEditing" class="split-view" :class="{ 'editor-expanded': isEditorExpanded }">
      <div class="pane preview-pane">
        <div class="markdown-body" v-html="renderedHtml"></div>
      </div>
      <div class="pane editor-pane">
        <MarkdownEditor 
          v-model="editableContent"
          :is-editor-expanded="isEditorExpanded"
          :is-saving="isSaving"
          @done="toggleEditMode"
          @toggle-expansion="toggleEditorExpansion"
        />
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
  right: 20px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.edit-button {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-button:hover {
  background-color: var(--accent-color);
  color: var(--text-accent-contrast);
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
  transition: width 0.3s ease-in-out;
}

.editor-pane {
  border-left: 1px solid var(--border-color);
}

.split-view.editor-expanded .preview-pane {
  width: 0;
  padding: 0;
  border: none;
}
.split-view.editor-expanded .editor-pane {
  width: 100%;
  border-left: none;
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