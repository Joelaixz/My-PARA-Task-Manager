<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';
import { history, defaultKeymap, undo, redo } from '@codemirror/commands';
import TurndownService from 'turndown';


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
const fontSize = ref(16); // 預設 16px

// --- CodeMirror 實例 ---
let view: EditorView | null = null;
let fontTheme = new Compartment();

// --- 2. 建立 Turndown 服務的實例 ---
// 目的：建立一個可重複使用的轉換器。可以對其進行配置，例如程式碼區塊的樣式。
const turndownService = new TurndownService({
  headingStyle: 'atx', // 使用 '#' 作為標題樣式
  codeBlockStyle: 'fenced' // 使用 '```' 作為程式碼區塊樣式
});


// --- Functions ---
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

// --- 3. 建立攔截貼上事件的 CodeMirror 擴充 ---
/**
 * 目的：建立一個 CodeMirror 擴充，用於攔截原生的貼上事件。
 * @returns {import('@codemirror/state').Extension}
 */
const pasteHandlerExtension = EditorView.domEventHandlers({
  paste(event, view) {
    // 從剪貼簿事件中獲取資料
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    // 優先檢查是否有 HTML 內容
    const html = clipboardData.getData('text/html');

    // 如果剪貼簿中有 HTML，則進行轉換
    if (html && html.length > 0) {
      // 阻止 CodeMirror 的預設貼上行為
      event.preventDefault();

      // 使用 Turndown 將 HTML 轉換為 Markdown
      const markdownContent = turndownService.turndown(html);

      // 手動將轉換後的內容插入編輯器
      view.dispatch({
        changes: {
          from: view.state.selection.main.from,
          to: view.state.selection.main.to,
          insert: markdownContent,
        },
        // 將選取區移動到插入內容的末尾
        selection: { anchor: view.state.selection.main.from + markdownContent.length }
      });

      return true; // 表示我們已經處理了這個事件
    }
    // 如果沒有 HTML，則讓 CodeMirror 執行預設的純文字貼上
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
      // --- 4. 將我們建立的貼上處理擴充加入 CodeMirror ---
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
          <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
        </button>
        <button @click="handleRedo" class="toolbar-button" title="下一步 (Ctrl+Y)">
          <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3l-3 2.7"/></svg>
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
          <svg v-if="!props.isEditorExpanded" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          <svg v-else xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H3v6M15 21h6v-6M3 3l7 7M21 21l-7-7"/></svg>
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