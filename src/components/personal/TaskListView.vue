<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import MarkdownEditor from '../MarkdownEditor.vue';
import TaskListItem from './TaskListItem.vue';
import TaskListTabs from './TaskListTabs.vue';
import InputDialog from '../sidebar/InputDialog.vue';

// 介面定義
interface TaskList {
  id: number;
  name: string;
  content: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}
interface ParsedTask {
  id: string;
  content: string;
  isCompleted: boolean;
  isPinned: boolean;
  dueDate: string | null;
  children: ParsedTask[];
}

const sampleMarkdown = `- [ ] 重要的主要任務 [截止:2025-12-20]
  - [ ] 子任務一 [截止:2025-12-10]
  - [ ] 子任務二 [pinned]
- [x] 已經完成的任務
`;

// 響應式狀態
const taskLists = ref<TaskList[]>([]);
const activeListId = ref<number | null>(null);
const activeListContent = ref('');
const parsedTasks = ref<ParsedTask[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);
const isEditing = ref(false);
const isEditorExpanded = ref(false);
const isInputDialogOpen = ref(false);
const inputDialogTitle = ref('');

// 生命週期鉤子
onMounted(async () => {
  await loadInitialTaskLists();
});

// 方法
async function loadInitialTaskLists() {
  isLoading.value = true;
  try {
    let lists = await window.ipcRenderer.getTaskLists();
    if (lists.length === 0) {
      const newList = await window.ipcRenderer.createTaskList('我的第一個任務清單');
      await window.ipcRenderer.updateTaskListContent(newList.id, sampleMarkdown);
      lists = await window.ipcRenderer.getTaskLists();
    }
    taskLists.value = lists;
    if (lists.length > 0 && activeListId.value === null) {
      activeListId.value = lists[0].id;
    }
  } catch (error) {
    console.error("Failed to load task lists:", error);
  } finally {
    isLoading.value = false;
  }
}

watch(activeListId, async (newId) => {
  if (newId === null) {
    activeListContent.value = '';
    parsedTasks.value = [];
    isEditing.value = false;
    return;
  }
  isEditing.value = false;
  isEditorExpanded.value = false;
  isLoading.value = true;
  try {
    const list = await window.ipcRenderer.getTaskList(newId);
    if (list) {
      activeListContent.value = list.content;
      await parseContent(list.content);
    } else {
      console.warn(`Task list with id ${newId} not found, it may have been deleted.`);
      activeListId.value = null;
      await loadInitialTaskLists();
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
  isEditorExpanded.value = false;
}

function handleSwitchTab(listId: number) {
  if (activeListId.value !== listId) {
    activeListId.value = listId;
  }
}

function handleNewTab() {
  inputDialogTitle.value = '建立新任務清單';
  isInputDialogOpen.value = true;
}

async function handleDialogConfirm(newName: string) {
  if (!newName || newName.trim() === '') return;
  try {
    const newList = await window.ipcRenderer.createTaskList(newName.trim());
    taskLists.value.push(newList);
    activeListId.value = newList.id;
  } catch (error) {
    console.error('Failed to create new task list:', error);
    alert('建立失敗，請稍後再試。');
  }
}

async function handleCloseTab(listIdToClose: number) {
  const listToClose = taskLists.value.find(l => l.id === listIdToClose);
  if (!listToClose) return;
  if (window.confirm(`確定要刪除「${listToClose.name}」這個任務清單嗎？此操作無法復原。`)) {
    try {
      const success = await window.ipcRenderer.deleteTaskList(listIdToClose);
      if (success) {
        const deletedIndex = taskLists.value.findIndex(l => l.id === listIdToClose);
        if (deletedIndex === -1) return;
        taskLists.value.splice(deletedIndex, 1);
        if (activeListId.value === listIdToClose) {
          if (taskLists.value.length === 0) {
            activeListId.value = null;
          } else {
            const newIndex = Math.max(0, deletedIndex - 1);
            activeListId.value = taskLists.value[newIndex].id;
          }
        }
      } else {
        alert('刪除失敗，請稍後再試。');
      }
    } catch (error) {
      console.error('Failed to delete task list:', error);
      alert('刪除時發生錯誤。');
    }
  }
}

async function handleReorderTabs(newLists: TaskList[]) {
  taskLists.value = newLists;
  const orderedIds = newLists.map(list => list.id);
  try {
    const success = await window.ipcRenderer.updateTaskListsOrder(orderedIds);
    if (!success) {
      console.error('Failed to update task lists order in the database.');
    }
  } catch (error) {
    console.error('Error sending reorder request to main process:', error);
  }
}

function handleLoadSample() {
  if (!activeListId.value) {
    alert('請先建立或選擇一個任務清單。');
    return;
  }
  if (window.confirm('這將會覆蓋您在目前列表中的所有內容，確定要載入範例嗎？')) {
    activeListContent.value = sampleMarkdown;
    isEditing.value = true;
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
          if (updates.isPinned) { if (!updatedLine.includes('[pinned]')) { updatedLine += ' [pinned]'; } }
          else { updatedLine = updatedLine.replace(/\s*\[pinned\]/g, ''); }
        }
        activeListContent.value = activeListContent.value.replace(match[0], updatedLine);
      }
      return true;
    }
    if (task.children.length > 0) {
      if (updateMarkdownTask(task.children, id, updates)) { return true; }
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
    <TaskListTabs
      :task-lists="taskLists"
      :active-list-id="activeListId"
      @switch-tab="handleSwitchTab"
      @new-tab="handleNewTab"
      @close-tab="handleCloseTab"
      @reorder-tabs="handleReorderTabs"
    />
    <div class="page-actions">
      <button class="action-button" @click="handleLoadSample">
        載入範例內容
      </button>
      <button v-if="!isEditing && activeListId !== null" class="action-button primary" @click="isEditing = true">
        編輯
      </button>
    </div>
    <div class="split-layout" :class="{ 'preview-only': !isEditing, 'editor-expanded': isEditing && isEditorExpanded }">
      <div class="preview-pane">
        <div v-if="isLoading && !activeListContent" class="loading-text">載入中...</div>
        <table v-else-if="activeListId !== null" class="task-table">
          <thead>
            <tr>
              <th class="status-col">狀態</th>
              <th class="task-col">任務</th>
              <th class="due-date-col">截止日期</th>
              <th class="actions-col">操作</th>
            </tr>
          </thead>
          <tbody :key="activeListId">
            <TaskListItem 
              v-for="task in parsedTasks"
              :key="task.id"
              :task="task"
              :level="0"
              @update-task="handleUpdateTask"
              @pin-task="handlePinTask"
            />
          </tbody>
        </table>
        <div v-else class="loading-text">
          沒有可顯示的任務清單。點擊上方 '+' 按鈕來建立一個新的清單。
        </div>
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
    <InputDialog
      v-model="isInputDialogOpen"
      :title="inputDialogTitle"
      :show-extension-select="false"
      @confirm="handleDialogConfirm"
    />
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

.page-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  gap: 0.75rem;
}

.action-button {
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}
.action-button:hover {
  border-color: var(--color-personal);
  color: var(--text-primary);
}
.action-button.primary {
  background-color: var(--color-personal);
  color: var(--text-accent-contrast);
  border-color: var(--color-personal);
}
.action-button.primary:hover {
    background-color: var(--color-personal-hover);
}

.split-layout {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
}
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
.split-layout.preview-only .preview-pane {
  flex-basis: 100%;
  border-right: none;
}
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
  padding: 1rem;
  text-align: center;
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
  text-align: left;
}
th.status-col { width: 80px; text-align: center; }
th.task-col { width: auto; }
th.due-date-col { width: 120px; text-align: center; }
th.actions-col { width: 80px; text-align: center; }
</style>