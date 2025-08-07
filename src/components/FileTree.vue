<script setup lang="ts">
import { defineProps } from 'vue'
import { useFileStore } from '../store'

// 目的：定義元件所接收的資料結構。
interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
  isExpanded?: boolean;
}

const props = defineProps<{
  entries: FileEntry[]
}>()

const fileStore = useFileStore()

/**
 * 目的：根據檔案的副檔名回傳對應的 emoji 圖示。
 * @param fileName - 檔案的完整名稱。
 * @returns 代表檔案類型的圖示字串。
 */
function getIconForFile(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'md':
      return '📝';
    case 'txt':
      return '📄';
    case 'pdf':
      return '📕';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return '🖼️';
    case 'svg':
      return '🎨';
    default:
      return '❔';
  }
}

/**
 * 目的：處理使用者點擊檔案樹中任一項目的行為。
 * @param entry - 使用者點擊的 FileEntry 物件。
 */
function handleEntryClick(entry: FileEntry) {
  if (entry.isDirectory) {
    // 若點擊的是資料夾，直接修改其 isExpanded 狀態來切換展開/收合
    // Vue 的響應式系統會自動更新畫面
    entry.isExpanded = !entry.isExpanded;
  } else {
    // 若點擊的是檔案，則呼叫 Pinia store 來更新全域選中狀態
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
          <FileTree :entries="entry.children" />
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
.file-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  user-select: none;
  color: var(--text-secondary);
}
.file-item:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}
.file-item.is-selected {
  background-color: var(--accent-color-muted);
  color: var(--text-primary);
  font-weight: 500;
}
.is-directory {
  color: var(--text-primary);
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
  width: 1.2em;
  text-align: center;
  margin-right: 8px;
}
.name-label {
  overflow: hidden;
  text-overflow: ellipsis;
}
.children-wrapper {
  padding-left: 8px;
}
</style>