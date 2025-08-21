<script setup lang="ts">
import { defineProps } from 'vue'
// --- 1. 新增點：匯入 useRouter ---
import { useRouter } from 'vue-router'
import path from 'path-browserify'
import { useFileStore } from '../../store'

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
// --- 2. 新增點：取得 router 實例 ---
const router = useRouter()

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
    fileStore.toggleFolderExpansion(entry.path);
    fileStore.selectFolder(entry.path);
  } else {
    // --- 3. 修改點：使用路由來處理檔案選擇和刷新 ---
    if (fileStore.selectedFilePath === entry.path) {
      // 如果點擊的是已選中的檔案，則在路由後面附加一個時間戳查詢參數
      // 這會改變 route.fullPath，從而觸發 RouterView 的 key 變化，強制重新渲染
      router.push({ path: '/view', query: { t: Date.now() } });
    } else {
      // 如果是選擇新檔案，則正常導航
      fileStore.selectFile(entry.path);
      router.push('/view');
    }
    
    // 選中檔案的同時，也將其所在的資料夾設為選中狀態
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
/* (樣式保持不變) */
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