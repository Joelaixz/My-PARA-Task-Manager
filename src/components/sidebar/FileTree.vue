<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router'
import path from 'path-browserify'
import { useFileStore, useMainStore } from '../../store'
import ContextMenu from './ContextMenu.vue';

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

const emit = defineEmits(['rename', 'delete']);

const fileStore = useFileStore()
const mainStore = useMainStore()
const router = useRouter()

const contextMenuState = ref({
  show: false,
  x: 0,
  y: 0,
  targetEntry: null as FileEntry | null,
});

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

async function handleEntryClick(entry: FileEntry) {
  if (entry.isDirectory) {
    // --- 1. 核心修正點：點擊資料夾時，清除已選中的檔案狀態 ---
    // 為什麼：這確保了操作的上下文是明確的。如果使用者接著點擊「新增」，
    //         程式會知道目標是在這個資料夾下，而不是在之前選中的某個檔案旁邊。
    fileStore.selectFile(null);
    fileStore.toggleFolderExpansion(entry.path);
    fileStore.selectFolder(entry.path);
  } else {
    const mode = mainStore.sidebarMode === 'files' 
      ? mainStore.previousSidebarMode 
      : mainStore.sidebarMode;
      
    if (mode) {
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

function showContextMenu(event: MouseEvent, entry: FileEntry) {
  contextMenuState.value.show = true;
  contextMenuState.value.x = event.clientX;
  contextMenuState.value.y = event.clientY;
  contextMenuState.value.targetEntry = entry;

  // 註解：右鍵點擊時也需要更新選中狀態，確保視覺上一致
  if (entry.isDirectory) {
    fileStore.selectFile(null); // 同樣，右鍵點擊資料夾時清除檔案選中
    fileStore.selectFolder(entry.path);
  } else {
    fileStore.selectFile(entry.path);
    fileStore.selectFolder(path.dirname(entry.path));
  }
}

function closeContextMenu() {
  contextMenuState.value.show = false;
  contextMenuState.value.targetEntry = null;
}

function onRenameRequest() {
  if (contextMenuState.value.targetEntry) {
    emit('rename', contextMenuState.value.targetEntry);
  }
  closeContextMenu();
}

function onDeleteRequest() {
  if (contextMenuState.value.targetEntry) {
    emit('delete', contextMenuState.value.targetEntry);
  }
  closeContextMenu();
}

onMounted(() => {
  window.addEventListener('click', closeContextMenu);
});

onUnmounted(() => {
  window.removeEventListener('click', closeContextMenu);
});

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
        @contextmenu.prevent="showContextMenu($event, entry)"
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
          <FileTree 
            :entries="entry.children"
            @rename="(entry) => emit('rename', entry)"
            @delete="(entry) => emit('delete', entry)"
          />
        </div>
      </div>
    </div>
    
    <ContextMenu
      :show="contextMenuState.show"
      :x="contextMenuState.x"
      :y="contextMenuState.y"
      @rename="onRenameRequest"
      @delete="onDeleteRequest"
    />
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