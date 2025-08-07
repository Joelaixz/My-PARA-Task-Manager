<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
// --- 1. 匯入 Compartment 和 EditorView ---
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';
import { history, defaultKeymap, undo, redo } from '@codemirror/commands';


// --- Props & Emits ---
const props = defineProps<{
  modelValue: string;
  isEditorExpanded: boolean;
  isSaving: boolean;
}>();

const emit = defineEmits([
  'update:modelValue',
  'done',
  'toggle-expansion'
]);

// --- Refs ---
const editorRef = ref<HTMLDivElement | null>(null);
// --- 2. 新增：控制字體大小的 ref ---
const fontSize = ref(16); // 預設 16px

// --- CodeMirror 實例 ---
let view: EditorView | null = null;
// --- 3. 新增：建立一個 Compartment 來管理動態的字體主題 ---
let fontTheme = new Compartment();


// --- Functions ---
function handleUndo() {
  if (view) undo(view);
}

function handleRedo() {
  if (view) redo(view);
}

// --- 4. 新增：字體大小調整函式 ---
function increaseFontSize() {
  if (fontSize.value < 32) { // 上限 32px
    fontSize.value += 1;
  }
}
function decreaseFontSize() {
  if (fontSize.value > 10) { // 下限 10px
    fontSize.value -= 1;
  }
}

// --- 5. 新增：一個根據字體大小建立主題的輔助函式 ---
const createFontTheme = (size: number) => {
  return EditorView.theme({
    '&': {
      fontSize: `${size}px`
    }
  });
};


onMounted(() => {
  if (!editorRef.value) return;

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      emit('update:modelValue', update.state.doc.toString());
    }
  });

  const startState = EditorState.create({
    doc: props.modelValue,
    extensions: [
      history(),
      keymap.of(defaultKeymap),
      markdown({ codeLanguages: languages }),
      oneDark,
      updateListener,
      EditorView.lineWrapping,
      // --- 6. 新增：在初始化時載入預設的字體主題 ---
      fontTheme.of(createFontTheme(fontSize.value)),
    ],
  });

  view = new EditorView({
    state: startState,
    parent: editorRef.value,
  });
});

watch(() => props.modelValue, (newValue) => {
  if (view && newValue !== view.state.doc.toString()) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newValue },
    });
  }
});

// --- 7. 新增：監聽 fontSize 的變化，並動態更新編輯器主題 ---
watch(fontSize, (newSize) => {
  if (view) {
    view.dispatch({
      effects: fontTheme.reconfigure(createFontTheme(newSize))
    });
  }
});
</script>

<template>
  <div class="editor-wrapper">
    <div class="editor-toolbar">
      <div class="button-group">
        <button @click="handleUndo" class="toolbar-button" title="上一步 (Ctrl+Z)">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
        </button>
        <button @click="handleRedo" class="toolbar-button" title="下一步 (Ctrl+Y)">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3l-3 2.7"/></svg>
        </button>
      </div>

      <div class="button-group">
        <button @click="decreaseFontSize" class="toolbar-button" title="縮小字體">-A</button>
        <span class="font-size-display">{{ fontSize }}px</span>
        <button @click="increaseFontSize" class="toolbar-button" title="放大字體">+A</button>
      </div>

      <div class="save-status-wrapper">
        <span v-if="props.isSaving" class="save-status">儲存中...</span>
      </div>

      <div class="button-group-right">
        <button @click="$emit('toggle-expansion')" class="toolbar-button" :title="props.isEditorExpanded ? '收合' : '展開'">
          <svg v-if="!props.isEditorExpanded" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H3v6M15 21h6v-6M3 3l7 7M21 21l-7-7"/></svg>
        </button>
        <button @click="$emit('done')" class="toolbar-button">完成</button>
      </div>
    </div>
    <div ref="editorRef" class="editor-container"></div>
  </div>
</template>

<style scoped>
.editor-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  flex-shrink: 0;
}

.save-status-wrapper {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.save-status {
  color: var(--text-secondary);
  font-size: 12px;
}

.button-group, .button-group-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 10px;
}

.toolbar-button {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px; /* 統一字體，避免 A 字元過大 */
}

.toolbar-button:hover {
  background-color: var(--accent-color);
  color: var(--text-accent-contrast);
}

/* 9. 新增：字體大小顯示的樣式 */
.font-size-display {
  color: var(--text-secondary);
  font-size: 12px;
  padding: 0 4px;
}


.editor-container {
  width: 100%;
  flex-grow: 1;
  overflow: auto;
}

.editor-container :deep(.cm-editor) {
  height: 100%;
  /* 移除固定的 font-size，交由動態主題控制 */
  line-height: 1.6;
}
</style>