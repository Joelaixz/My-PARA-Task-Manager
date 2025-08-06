<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { marked } from 'marked'

// --- Props ---
// 目的：定義元件接收的外部資料。
// content: Markdown 格式的原始字串。
const props = defineProps<{
  content: string | null
}>()

// --- Computed ---
// 目的：將傳入的 Markdown 字串即時轉換為 HTML。
// 這是一個計算屬性，只有當 props.content 發生變化時，它才會重新計算。
const renderedHtml = computed(() => {
  if (typeof props.content === 'string') {
    // 【安全第一】 'marked' 預設會對 HTML 進行淨化 (Sanitize)，
    // 但若未來更換函式庫或調整設定，需確保不會有關閉淨化導致的 XSS 風險。
    return marked(props.content)
  }
  return '' // 如果沒有內容，則回傳空字串
})
</script>

<template>
  <div class="markdown-body" v-html="renderedHtml"></div>
</template>

<style scoped>
.markdown-body {
  padding: 1rem 2.5rem; /* 增加左右 padding */
  line-height: 1.7;
  color: var(--text-primary);
  word-wrap: break-word;
}

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