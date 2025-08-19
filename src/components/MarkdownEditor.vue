<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';
import { history, defaultKeymap, undo, redo } from '@codemirror/commands';
import TurndownService from 'turndown';


// --- (Props & Emits 保持不變) ---
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

// --- (Refs 保持不變) ---
const editorRef = ref<HTMLDivElement | null>(null);
const fontSize = ref(16);

// --- (CodeMirror 實例保持不變) ---
let view: EditorView | null = null;
let fontTheme = new Compartment();

// --- (Turndown 服務實例保持不變) ---
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});


// --- (Functions 保持不變) ---
function handleUndo() {
  if (view) undo(view);
}

function handleRedo() {
  if (view) redo(view);
}

function increaseFontSize() {
  if (fontSize.value < 32) {
    fontSize.value += 1;
  }
}
function decreaseFontSize() {
  if (fontSize.value > 10) {
    fontSize.value -= 1;
  }
}

const createFontTheme = (size: number) => {
  return EditorView.theme({
    '&': {
      fontSize: `${size}px`
    }
  });
};

// --- 1. 修改點：更新貼上事件的處理邏輯 ---
/**
 * 目的：建立一個 CodeMirror 擴充，用於攔截並智慧處理貼上事件。
 * @returns {import('@codemirror/state').Extension}
 */
const pasteHandlerExtension = EditorView.domEventHandlers({
  paste(event, view) {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return false;

    // 同時獲取純文字和 HTML 內容
    const plainText = clipboardData.getData('text/plain');
    const html = clipboardData.getData('text/html');

    // 為什麼：這是一個「啟發式」判斷。我們檢查純文字內容是否以 Markdown 列表的形式開頭。
    //         如果是，我們就非常有信心地認為使用者是想貼上原始的 Markdown 程式碼。
    //         正則表達式 /^\s*[-*] \[[\s\w]\]/.test(plainText) 的意思是：
    //         - /^\s*/: 開頭可以是零或多個空白字元
    //         - /[-*]/: 接著是一個連字號或星號
    //         - / \[[\s\w]\]/: 接著是一個空格和一個方括號，裡面可以是一個空格或 'x'
    if (plainText && /^\s*[-*] \[[\s\w]\]/.test(plainText)) {
      // 返回 false 會告知 CodeMirror：「我對這個事件不感興趣，請使用你預設的貼上純文字的方式處理。」
      // 這樣就能完美保留所有原始格式。
      return false;
    }

    // 如果上面的判斷不成立（例如，從一般網頁複製文章），
    // 且剪貼簿中確實有 HTML 內容，我們才啟用 Turndown 進行轉換。
    // 這保留了原有的便利功能。
    if (html && html.length > 0) {
      event.preventDefault(); // 阻止預設行為
      const markdownContent = turndownService.turndown(html);
      
      // 手動將轉換後的內容插入編輯器
      view.dispatch({
        changes: {
          from: view.state.selection.main.from,
          to: view.state.selection.main.to,
          insert: markdownContent,
        },
        selection: { anchor: view.state.selection.main.from + markdownContent.length }
      });
      
      return true; // 表示我們已經處理了這個事件
    }
    
    // 如果以上條件都不滿足，同樣使用預設行為。
    return false;
  }
});


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
      fontTheme.of(createFontTheme(fontSize.value)),
      // 將我們更新後的貼上處理擴充加入 CodeMirror
      pasteHandlerExtension,
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
/* (樣式保持不變) */
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
  font-size: 12px;
}

.toolbar-button:hover {
  background-color: var(--accent-color);
  color: var(--text-accent-contrast);
}

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
  line-height: 1.6;
}
</style>