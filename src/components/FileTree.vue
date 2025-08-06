<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import { useFileStore } from '../store' // --- 1. 匯入我們建立的 FileStore ---

// --- 型別定義 ---
interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
  isExpanded?: boolean;
}

// --- Props ---
const props = defineProps<{
  entries: FileEntry[]
}>()

// --- Emits ---
// 目的：我們不再需要向上發送 selectFile 事件，所以將其從定義中移除。
const emit = defineEmits<{
  (e: 'toggleFolder', entry: FileEntry): void
}>()

// --- 2. 實例化 Store ---
const fileStore = useFileStore()

// --- 新增：根據檔名回傳對應圖示的函數 ---
// 目的：讓檔案列表能根據檔案類型顯示不同的圖示，增加可讀性。
function getIconForFile(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'md':
      return '📝'; // Markdown
    case 'txt':
      return '📄'; // Text
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return '🖼️'; // 常見圖片
    case 'svg':
      return '🎨'; // SVG 向量圖
    default:
      return '❔'; // 其他未知檔案
  }
}

// --- 事件處理 ---
// 目的：點擊目錄時，依然發送事件讓父層處理展開/收合；點擊檔案時，則直接更新全域狀態。
function handleEntryClick(entry: FileEntry) {
  if (entry.isDirectory) {
    emit('toggleFolder', entry)
  } else {
    // --- 3. 呼叫 Store 的 action 來更新狀態 ---
    fileStore.selectFile(entry.path)
  }
}
</script>

<template>
  <div class="file-tree-container">
    <div v-for="entry in props.entries" :key="entry.path" class="file-tree-node">
      <div 
        class="file-item" 
        :class="{ 
          'is-directory': entry.isDirectory,
          'is-selected': !entry.isDirectory && fileStore.selectedFilePath === entry.path
        }" 
        @click="handleEntryClick(entry)"
      >
        <span v-if="entry.isDirectory" class="arrow-icon" :class="{ 'is-expanded': entry.isExpanded }">▶</span>
        <span v-else class="arrow-placeholder"></span>
        
        <span class="type-icon">
          {{ entry.isDirectory ? '📁' : getIconForFile(entry.name) }}
        </span>
        
        <span class="name-label" :title="entry.name">{{ entry.name }}</span>
      </div>
      <div v-if="entry.isDirectory && entry.isExpanded && entry.children?.length">
        <div class="children-wrapper">
          <FileTree 
            :entries="entry.children" 
            @toggle-folder="(childEntry) => emit('toggleFolder', childEntry)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-tree-container {
  width: max-content;
  min-width: 100%;
}

.file-tree-node {
  /* 每個節點的容器 */
}

.file-item {
  display: flex;
  align-items: center;
  padding: 6px 0px;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  user-select: none;
}

.file-item:hover {
  background-color: #ecf5ff;
}

/* --- 新增：被選中檔案的樣式 --- */
.file-item.is-selected {
  background-color: #d9ecff;
  font-weight: 500;
}

.is-directory {
  font-weight: 500;
}

.arrow-icon {
  width: 1em;
  font-size: 10px;
  margin-right: 4px;
  text-align: center;
  transition: transform 0.2s ease;
}

.arrow-icon.is-expanded {
  transform: rotate(90deg);
}

.arrow-placeholder {
  display: inline-block;
  width: 1em;
  margin-right: 4px;
}

.type-icon {
  width: 1.2em; /* 讓圖示寬度一致，避免文字對齊跳動 */
  text-align: center;
  margin-right: 8px;
}

.name-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* --- 修改：子節點的樣式，增加縮排 --- */
.children-wrapper {
  padding-left: 22px; /* 箭頭+圖示的寬度，讓子項目對齊 */
}
</style>