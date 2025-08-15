<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
// 註解：由於「查看全部」功能改為內部展開，不再需要 RouterLink
// import { RouterLink } from 'vue-router';

interface PinnedTask extends ParsedTask {
  sourceList: string;
  sourceListId: number;
}

const pinnedTasks = ref<PinnedTask[]>([]);
const isLoading = ref(true);
// --- 1. 新增：控制列表是否完全展開的狀態 ---
const isExpanded = ref(false);

const displayedTasks = computed(() => {
  // 如果是展開狀態，顯示所有任務；否則只顯示前 3 個
  if (isExpanded.value) {
    return pinnedTasks.value;
  }
  return pinnedTasks.value.slice(0, 3);
});

function findPinnedTasks(tasks: ParsedTask[], sourceName: string, sourceId: number): PinnedTask[] {
  let results: PinnedTask[] = [];
  for (const task of tasks) {
    if (task.isPinned) {
      results.push({ ...task, sourceList: sourceName, sourceListId: sourceId });
    }
    if (task.children && task.children.length > 0) {
      results = results.concat(findPinnedTasks(task.children, sourceName, sourceId));
    }
  }
  return results;
}

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
  task.isCompleted = isCompleted;
  await updateSourceMarkdown(task, { isCompleted });
}

async function handlePinTask(task: PinnedTask) {
  pinnedTasks.value = pinnedTasks.value.filter(p => p.id !== task.id);
  await updateSourceMarkdown(task, { isPinned: false });
}

onMounted(async () => {
  try {
    const allLists = await window.ipcRenderer.getTaskLists();
    let allPinnedTasks: PinnedTask[] = [];

    for (const list of allLists) {
      if (list.content) {
        const parsed = await window.ipcRenderer.parseMarkdownTasks(list.content);
        const pinned = findPinnedTasks(parsed, list.name, list.id);
        allPinnedTasks = allPinnedTasks.concat(pinned);
      }
    }
    pinnedTasks.value = allPinnedTasks;
  } catch (error) {
    console.error("Failed to load pinned tasks:", error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="board-note tasks-card">
    <div class="widget-header">
      <h3 class="widget-title">📋 今日任務清單</h3>
      <button 
        v-if="pinnedTasks.length > 3" 
        @click="isExpanded = !isExpanded" 
        class="view-all-button"
      >
        {{ isExpanded ? '收合' : `查看全部 (${pinnedTasks.length})` }}
      </button>
    </div>
    <div v-if="isLoading" class="feedback-message">讀取中...</div>
    <table v-else-if="pinnedTasks.length > 0" class="task-table">
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
/* --- 4. 修改點：恢復卡片的基礎樣式 --- */
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

/* --- 5. 新增點：表格標頭樣式 --- */
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

/* 讓表頭和內容對齊 */
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