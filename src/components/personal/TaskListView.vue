<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import MarkdownEditor from '../MarkdownEditor.vue';
import TaskListItem from './TaskListItem.vue';

const sampleMarkdown = `- [ ] 重要的主要任務 [截止:2025-12-20]
  - [ ] 子任務一 [截止:2025-12-10]
  - [ ] 子任務二 [pinned]
- [x] 已經完成的任務
`;

const taskLists = ref<TaskList[]>([]);
const activeListId = ref<number | null>(null);
const activeListContent = ref('');
const parsedTasks = ref<ParsedTask[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);

const isEditing = ref(false);
// --- 1. 修改點：將 isEditorExpanded 初始值設為 false ---
// 目的：符合您的定義，「收合」狀態 (isEditorExpanded=false) 代表 50/50 佈局。
const isEditorExpanded = ref(false); 

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
  
  isEditing.value = false;
  isEditorExpanded.value = false; // 切換列表時，重置為 50/50 模式
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

async function handleDoneEditing() {
  await saveChanges();
  isEditing.value = false;
  isEditorExpanded.value = false; // 退出編輯時，重置為 50/50 模式
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
      
      <button v-if="!isEditing" class="edit-button" @click="isEditing = true">
        編輯
      </button>
    </div>
    
    <div class="split-layout" :class="{ 'preview-only': !isEditing, 'editor-expanded': isEditing && isEditorExpanded }">
      <div class="preview-pane">
        <div v-if="isLoading" class="loading-text">載入中...</div>
        <table v-else class="task-table">
          <thead>
            <tr>
              <th class="status-col">狀態</th>
              <th class="task-col">任務</th>
              <th class="due-date-col">截止日期</th>
              <th class="actions-col">操作</th>
            </tr>
          </thead>
          <TaskListItem 
            v-for="task in parsedTasks"
            :key="task.id"
            :task="task"
            :level="0"
            @update-task="handleUpdateTask"
            @pin-task="handlePinTask"
          />
        </table>
      </div>

      <div v-if="isEditing" class="editor-pane">
        <MarkdownEditor 
          v-model="activeListContent"
          :is-editor-expanded="isEditorExpanded"
          :is-saving="isSaving"
          @done="handleDoneEditing"
          @toggle-expansion="isEditorExpanded = !isEditorExpanded"
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

.edit-button {
  margin-left: auto;
  background-color: var(--color-personal);
  color: var(--text-accent-contrast);
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.85rem;
}

.split-layout {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
}

/* --- 3. 修改點：重新定義三種狀態下的 flex 佈局樣式 --- */

/* 預設雙欄編輯 (50/50) */
.preview-pane {
  flex: 1 1 50%;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  padding: 1rem 1.5rem;
  border-right: 1px solid var(--border-color);
  transition: all 0.3s ease-in-out;
}
.editor-pane {
  flex: 1 1 50%;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  padding: 0;
  transition: all 0.3s ease-in-out;
}

/* 狀態一：僅預覽模式 (100/0) */
.split-layout.preview-only .preview-pane {
  flex-basis: 100%;
  border-right: none;
}

/* 狀態三：專注編輯模式 (0/100) */
.split-layout.editor-expanded .preview-pane {
  flex-basis: 0;
  padding-left: 0;
  padding-right: 0;
  overflow: hidden;
  border-right: none;
}
.split-layout.editor-expanded .editor-pane {
  flex-basis: 100%;
}


.loading-text {
  color: var(--text-secondary);
}

.task-table {
  width: 100%;
  border-collapse: collapse;
}

.task-table th {
  padding: 0.75rem 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  border-bottom: 2px solid var(--border-color);
}

.status-col { width: 80px; text-align: center; }
.task-col { width: auto; text-align: left; }
.due-date-col { width: 120px; text-align: center; }
.actions-col { width: 80px; text-align: center; }
</style>