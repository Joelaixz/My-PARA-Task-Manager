// 檔案位置: src/components/personal/dashboard/TodayTasksCard.vue
<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useMainStore, type PinnedTask } from '../../../store';

const mainStore = useMainStore();

const displayedTasks = computed(() => {
  if (isExpanded.value) {
    return mainStore.pinnedTasks;
  }
  return mainStore.pinnedTasks.slice(0, 3);
});
// 註解：isLoading 狀態依然保留，用於初次載入時顯示提示。
const isLoading = computed(() => mainStore.isLoadingPinnedTasks);

const isExpanded = ref(false);

onMounted(() => {
  mainStore.fetchPinnedTasks();
});

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

// --- 1. 修改點：實作樂觀更新 ---
async function handleUpdateTask(task: PinnedTask, isCompleted: boolean) {
  // 步驟 1：立即更新 Pinia Store 中的狀態，UI 會瞬間響應。
  mainStore.updatePinnedTaskStatus(task.id, isCompleted);
  // 步驟 2：在背景執行實際的檔案儲存操作，此操作不再影響 UI。
  await updateSourceMarkdown(task, { isCompleted });
}

async function handlePinTask(task: PinnedTask) {
  // 步驟 1：在背景執行取消釘選的儲存操作。
  await updateSourceMarkdown(task, { isPinned: false });
  // 步驟 2：儲存成功後，重新從後端獲取完整的釘選列表。
  // 為什麼：取消釘選是一個「移除」操作，重新獲取列表是確保 UI 正確性的最簡單方式。
  //         因為這不是高頻操作，所以這裡的短暫 loading 是可以接受的。
  mainStore.fetchPinnedTasks();
}
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
/* (樣式保持不變) */
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