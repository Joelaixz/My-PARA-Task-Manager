<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
// 匯入我們剛剛安裝的套件
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits(['update:modelValue']);

const editorRef = ref<HTMLDivElement | null>(null);

let view: EditorView | null = null;

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
      // --- 修正之處：移除多餘的 base 屬性 ---
      markdown({ codeLanguages: languages }),
      oneDark,
      updateListener,
      EditorView.lineWrapping, 
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
</script>

<template>
  <div ref="editorRef" class="editor-container"></div>
</template>

<style scoped>
.editor-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.editor-container :deep(.cm-editor) {
  height: 100%;
  font-size: 14px;
  line-height: 1.6;
}
</style>