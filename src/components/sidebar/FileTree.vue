<script setup lang="ts">
import { useRouter } from 'vue-router'
import path from 'path-browserify'
// --- 1. 新增點：同時匯入 useMainStore ---
import { useFileStore, useMainStore } from '../../store'

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
const router = useRouter()
// --- 2. 新增點：取得 mainStore 實例 ---
const mainStore = useMainStore()

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
async function handleEntryClick(entry: FileEntry) {
  if (entry.isDirectory) {
    fileStore.toggleFolderExpansion(entry.path);
    fileStore.selectFolder(entry.path);
  } else {
    // 3. 修改點：在選中檔案後，呼叫後端儲存此路徑
    // 為什麼：這是實現「記憶最後開啟檔案」功能的關鍵。我們需要知道是在哪個模式下選中了哪個檔案。
    const mode = mainStore.sidebarMode === 'files' 
      ? mainStore.previousSidebarMode 
      : mainStore.sidebarMode;
      
    if (mode) {
      // 將這個檔案路徑與當前模式綁定並儲存
      await window.ipcRenderer.setLastFileForMode(mode, entry.path);
    }

    if (fileStore.selectedFilePath === entry.path) {
      router.push({ path: '/view', query: { t: Date.now() } });
    } else {
      fileStore.selectFile(entry.path);
      router.push('/view');
    }
    
    fileStore.selectFolder(path.dirname(entry.path));
  }
}
</script>

<template>
  <div class="file-tree-container">
    <div v-for="entry in props.entries" :key="entry.path" class="file-tree-node">
      <div
        class="file-item interactive-item rounded-sm no-select"
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
  color: var(--text-secondary);
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