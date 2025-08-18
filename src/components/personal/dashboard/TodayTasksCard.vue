// 檔案位置: src/components/personal/dashboard/TodayTasksCard.vue
<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
// --- 1. 新增點：匯入 useMainStore 和 PinnedTask 型別 ---
import { useMainStore, type PinnedTask } from '../../../store';

// --- 2. 新增點：獲取 mainStore 的實例 ---
const mainStore = useMainStore();

// --- 3. 修改點：移除本地狀態，改用 computed 從 store 讀取 ---
// 目的：讓元件的顯示資料直接與 Pinia store 的狀態綁定。
const displayedTasks = computed(() => {
  // isExpanded 的邏輯保持不變，但資料來源變為 mainStore.pinnedTasks
  if (isExpanded.value) {
    return mainStore.pinnedTasks;
  }
  return mainStore.pinnedTasks.slice(0, 3);
});
const isLoading = computed(() => mainStore.isLoadingPinnedTasks);

// isExpanded 的本地狀態保持不變，因为它只屬於這個元件的 UI 行為
const isExpanded = ref(false);

// --- 4. 修改點：簡化 onMounted ---
// 目的：元件掛載時，不再自己處理複雜的資料獲取邏輯，而是呼叫 store 的 action。
onMounted(() => {
  mainStore.fetchPinnedTasks();
});


// --- 5. 修改點：更新 handleUpdateTask 和 handlePinTask ---
// 目的：當使用者操作任務時，除了更新後端，還要再次觸發 store 的 action，
//       以確保所有訂閱此狀態的元件（如 WelcomeHeader）都能收到最新資料。
async function updateSourceMarkdown(task: PinnedTask, updates: { isCompleted?: boolean; isPinned?: boolean }) {
  try {
    const sourceList = await window.ipcRenderer.getTaskList(task.sourceListId);
    if (!sourceList || !sourceList.content) return;

    let markdownContent = sourceList.content;
    const originalTaskLineRegex = new RegExp(`(-\\s*\\[[ xX]\\]\\s*${task.content.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}.*)`);
    const match = markdownContent.match(originalTaskLineRegex);

    if (match) {
      let updatedLine = match[0];
      if (updates.isCompleted !== undefined) {
        updatedLine = updatedLine.replace(/\[[ xX]\]/, updates.isCompleted ? '[x]' : '[ ]');
      }
      if (updates.isPinned !== undefined) {
        if (updates.isPinned) {
          if (!updatedLine.includes('[pinned]')) updatedLine += ' [pinned]';
        } else {
          updatedLine = updatedLine.replace(/\s*\[pinned\]/g, '');
        }
      }
      markdownContent = markdownContent.replace(match[0], updatedLine);
      await window.ipcRenderer.updateTaskListContent(task.sourceListId, markdownContent);
    }
  } catch (error) {
    console.error("Failed to update source markdown:", error);
  }
}

async function handleUpdateTask(task: PinnedTask, isCompleted: boolean) {
  await updateSourceMarkdown(task, { isCompleted });
  // 重新獲取全局釘選任務狀態
  mainStore.fetchPinnedTasks();
}

async function handlePinTask(task: PinnedTask) {
  await updateSourceMarkdown(task, { isPinned: false });
  // 重新獲取全局釘選任務狀態
  mainStore.fetchPinnedTasks();
}

// --- 6. 刪除點：移除本地的 findPinnedTasks 函式 ---
// 因為這個邏輯已經被遷移到 Pinia store 的 fetchPinnedTasks action 中了。
</script>

<template>
  <div class="board-note tasks-card">
    <div class="widget-header">
      <h3 class="widget-title">📋 今日任務清單</h3>
      <button 
        v-if="mainStore.pinnedTasks.length > 3" 
        @click="isExpanded = !isExpanded" 
        class="view-all-button"
      >
        {{ isExpanded ? '收合' : `查看全部 (${mainStore.pinnedTasks.length})` }}
      </button>
    </div>
    <div v-if="isLoading" class="feedback-message">讀取中...</div>
    <table v-else-if="mainStore.pinnedTasks.length > 0" class="task-table">
      <thead>
        <tr>
          <th class="status-col">狀態</th>
          <th class="task-col">任務</th>
          <th class="date-col">截止日期</th>
          <th class="action-col">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr 
          v-for="task in displayedTasks" 
          :key="task.id"
          class="task-row"
          :class="{ 'is-done': task.isCompleted }"
        >
          <td class="status-col">
            <input 
              type="checkbox" 
              :checked="task.isCompleted" 
              @change="handleUpdateTask(task, ($event.target as HTMLInputElement).checked)"
            />
          </td>
          <td class="task-col">
            <div class="task-info">
              <span class="task-text">{{ task.content }}</span>
              <span class="task-source">{{ task.sourceList }}</span>
            </div>
          </td>
          <td class="date-col">
             <span v-if="task.dueDate">{{ task.dueDate }}</span>
          </td>
          <td class="action-col">
             <button @click="handlePinTask(task)" title="取消釘選">📌</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="feedback-message">
      沒有已釘選的任務。
    </div>
  </div>
</template>

<style scoped>
.board-note.tasks-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  border-left: 4px solid var(--color-resources);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-shrink: 0;
}

.widget-title {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
}
.view-all-button {
  font-size: 0.8rem;
  color: var(--link-color);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}
.view-all-button:hover {
  text-decoration: underline;
}

.task-table {
  width: 100%;
  border-collapse: collapse;
}

.task-table th {
  text-align: left;
  padding: 0.75rem 4px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  border-bottom: 1px solid var(--border-color);
}


.task-row td {
  padding: 0.75rem 4px;
  border-bottom: 1px solid var(--border-color);
}
.task-table tr:last-child td {
  border-bottom: none;
}

.task-row.is-done .task-text {
  text-decoration: line-through;
  color: var(--text-secondary);
}

.status-col { width: 40px; text-align: center; }
.task-col { width: auto; }
.date-col { width: 100px; text-align: center; font-size: 13px; color: var(--text-secondary); }
.action-col { width: 50px; text-align: center; }

th.status-col, th.date-col, th.action-col {
  text-align: center;
}
th.task-col {
  text-align: left;
}


.action-col button {
  background: none; border: none; cursor: pointer; opacity: 0.8;
}
.action-col button:hover { opacity: 1; }

.task-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.task-text {
  color: var(--text-primary);
  font-size: 0.9rem;
  line-height: 1.4;
}
.task-source {
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.8;
}

.feedback-message {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
}
</style>