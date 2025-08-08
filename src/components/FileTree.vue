<script setup lang="ts">
import { defineProps } from 'vue'
import path from 'path-browserify'
import { useFileStore } from '../store'

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
  // isExpanded 屬性雖然還存在於介面中，但我們不再直接依賴它來渲染
  isExpanded?: boolean;
}

const props = defineProps<{
  entries: FileEntry[]
}>()

// --- 1. 取得 file store 的實例 ---
// 目的：讓元件可以直接存取和操作共享的狀態。
const fileStore = useFileStore()

function getIconForFile(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'md': return '📝';
    case 'txt': return '📄';
    case 'pdf': return '📕';
    case 'png': case 'jpg': case 'jpeg': case 'gif': return '🖼️';
    case 'svg': return '🎨';
    default: return '❔';
  }
}

/**
 * 目的：處理使用者點擊檔案樹中任一項目的行為。
 * @param entry - 使用者點擊的 FileEntry 物件。
 */
function handleEntryClick(entry: FileEntry) {
  if (entry.isDirectory) {
    // --- 2. 修改：不再直接修改 entry 物件的狀態 ---
    // 而是呼叫 store 的 action 來集中管理狀態變更。
    fileStore.toggleFolderExpansion(entry.path);
    fileStore.selectFolder(entry.path);
  } else {
    fileStore.selectFile(entry.path)
    fileStore.selectFolder(path.dirname(entry.path));
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
          'is-selected-file': !entry.isDirectory && fileStore.selectedFilePath === entry.path,
          'is-selected-folder': entry.isDirectory && fileStore.selectedFolderPath === entry.path
        }"
        @click="handleEntryClick(entry)"
      >
        <span v-if="entry.isDirectory" class="arrow-icon" :class="{ 'is-expanded': fileStore.expandedFolderPaths.has(entry.path) }">▶</span>
        <span v-else class="arrow-placeholder"></span>

        <span class="type-icon">
          {{ entry.isDirectory ? '📁' : getIconForFile(entry.name) }}
        </span>

        <span class="name-label" :title="entry.name">{{ entry.name }}</span>
      </div>
      <div v-if="entry.isDirectory && fileStore.expandedFolderPaths.has(entry.path) && entry.children?.length">
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
.file-item.is-selected-file {
  background-color: var(--accent-color-muted);
  color: var(--text-primary);
  font-weight: 500;
}
.file-item.is-selected-folder {
  background-color: var(--bg-tertiary);
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