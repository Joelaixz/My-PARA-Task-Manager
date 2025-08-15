<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import MarkdownEditor from '../MarkdownEditor.vue';
import TaskListItem from './TaskListItem.vue';

const sampleMarkdown = `- [ ] 重要的主要任務
  - [ ] 子任務一
  - [ ] 子任務二 [pinned]
- [x] 已經完成的任務
`;

const taskLists = ref<TaskList[]>([]);
const activeListId = ref<number | null>(null);
const activeListContent = ref('');
const parsedTasks = ref<ParsedTask[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);

onMounted(async () => {
  isLoading.value = true;
  try {
    const lists = await window.ipcRenderer.getTaskLists();
    taskLists.value = lists;
    if (lists.length > 0) {
      activeListId.value = lists[0].id;
    } else {
      const newList = await window.ipcRenderer.createTaskList('我的第一個任務清單');
      taskLists.value.push(newList);
      activeListId.value = newList.id;
    }
  } catch (error) {
    console.error("Failed to load task lists:", error);
  } finally {
    isLoading.value = false;
  }
});

watch(activeListId, async (newId) => {
  if (newId === null) {
    activeListContent.value = '';
    parsedTasks.value = [];
    return;
  }
  
  isLoading.value = true;
  try {
    const list = await window.ipcRenderer.getTaskList(newId);
    if (list) {
      const contentToLoad = list.content.trim() === '' ? sampleMarkdown : list.content;
      activeListContent.value = contentToLoad;
      await parseContent(contentToLoad);
    }
  } catch (error) {
    console.error(`Failed to load task list content for id ${newId}:`, error);
  } finally {
    isLoading.value = false;
  }
});

async function parseContent(markdown: string) {
  try {
    parsedTasks.value = await window.ipcRenderer.parseMarkdownTasks(markdown);
  } catch (error) {
    console.error("Failed to parse markdown:", error);
  }
}

async function saveChanges() {
  if (activeListId.value === null) return;
  isSaving.value = true;
  try {
    await window.ipcRenderer.updateTaskListContent(activeListId.value, activeListContent.value);
    await parseContent(activeListContent.value);
  } catch (error) {
    console.error("Failed to save changes:", error);
  } finally {
    isSaving.value = false;
  }
}

function updateMarkdownTask(tasks: ParsedTask[], id: string, updates: { isCompleted?: boolean; isPinned?: boolean }): boolean {
  for (const task of tasks) {
    if (task.id === id) {
      const originalTaskLineRegex = new RegExp(`(-\\s*\\[[ xX]\\]\\s*${task.content.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}.*)`);
      let match = activeListContent.value.match(originalTaskLineRegex);
      
      if (match) {
        let updatedLine = match[0];
        if (updates.isCompleted !== undefined) {
          updatedLine = updatedLine.replace(/\[[ xX]\]/, updates.isCompleted ? '[x]' : '[ ]');
        }
        if (updates.isPinned !== undefined) {
          if (updates.isPinned) {
            if (!updatedLine.includes('[pinned]')) {
              updatedLine += ' [pinned]';
            }
          } else {
            updatedLine = updatedLine.replace(/\s*\[pinned\]/g, '');
          }
        }
        activeListContent.value = activeListContent.value.replace(match[0], updatedLine);
      }
      return true;
    }
    if (task.children.length > 0) {
      if (updateMarkdownTask(task.children, id, updates)) {
        return true;
      }
    }
  }
  return false;
}

async function handleUpdateTask(payload: { id: string; isCompleted: boolean }) {
  updateMarkdownTask(parsedTasks.value, payload.id, { isCompleted: payload.isCompleted });
  await saveChanges();
}

async function handlePinTask(payload: { id: string; isPinned: boolean }) {
  updateMarkdownTask(parsedTasks.value, payload.id, { isPinned: payload.isPinned });
  await saveChanges();
}
</script>

<template>
  <div class="task-list-page">
    <div class="list-tabs">
      <select v-model="activeListId" class="task-list-selector" :disabled="isLoading">
        <option v-for="list in taskLists" :key="list.id" :value="list.id">
          {{ list.name }}
        </option>
      </select>
      
      <button class="done-button" @click="saveChanges" :disabled="isSaving">
        {{ isSaving ? '儲存中...' : '儲存變更' }}
      </button>
    </div>
    
    <div class="split-layout">
      <div class="preview-pane">
        <div v-if="isLoading" class="loading-text">載入中...</div>
        <div v-else class="task-render-list">
          <TaskListItem 
            v-for="task in parsedTasks"
            :key="task.id"
            :task="task"
            @update-task="handleUpdateTask"
            @pin-task="handlePinTask"
          />
        </div>
      </div>

      <div class="editor-pane">
        <MarkdownEditor 
          v-model="activeListContent"
          :is-editor-expanded="true"
          :is-saving="isSaving"
          @toggle-expansion="() => {}"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-list-page {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.list-tabs {
  display: flex;
  align-items: center;
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  padding: 0.5rem 1rem;
  flex-shrink: 0;
  gap: 0.75rem;
}

.task-list-selector {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 0.9rem;
}

.done-button {
  margin-left: auto;
  background-color: var(--color-personal);
  color: var(--text-accent-contrast);
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.85rem;
}
.done-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.split-layout {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
}

.editor-pane,
.preview-pane {
  width: 50%;
  height: 100%;
  overflow-y: auto;
}

.editor-pane {
  padding: 0;
}

/* --- 2. 修改點：將邊框樣式從 editor-pane 移至 preview-pane --- */
.preview-pane {
  padding: 1rem 1.5rem;
  border-right: 1px solid var(--border-color);
}

.loading-text {
  color: var(--text-secondary);
}
.task-render-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>