<script setup lang="ts">
import { ref } from 'vue';

// 介面定義
interface ParsedTask {
  id: string;
  content: string;
  isCompleted: boolean;
  isPinned: boolean;
  dueDate: string | null;
  children: ParsedTask[];
}

interface Props {
  task: ParsedTask;
  level?: number;
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
});

const emit = defineEmits<{
  (e: 'update-task', payload: { id: string; isCompleted: boolean }): void;
  (e: 'pin-task', payload: { id: string; isPinned: boolean }): void;
}>();

// --- 1. 修改點：將 isExpanded 的預設值改為 false ---
// 目的：讓所有帶有子任務的項目在初始載入時，預設為收合狀態。
const isExpanded = ref(false);

// 方法
function handleCheckboxChange(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update-task', { id: props.task.id, isCompleted: target.checked });
}

function handlePinClick() {
  emit('pin-task', { id: props.task.id, isPinned: !props.task.isPinned });
}

// 事件冒泡
function bubbleUpdate(payload: { id: string; isCompleted: boolean }) {
  emit('update-task', payload);
}

function bubblePin(payload: { id: string; isPinned: boolean }) {
  emit('pin-task', payload);
}
</script>

<template>
  <tr 
    class="task-row" 
    :class="{ 
      'is-completed': task.isCompleted,
      'is-main-task': props.level === 0
    }"
  >
    <td class="status-col">
      <input 
        type="checkbox" 
        :checked="task.isCompleted"
        class="task-checkbox"
        @change="handleCheckboxChange"
      />
    </td>
    <td class="task-col">
      <!-- 1. 修改點：整合 .flex-center (部分取代 .task-content-wrapper) -->
      <div class="task-content-wrapper flex-center" :style="{ paddingLeft: `${props.level * 28}px` }">
        <span 
          v-if="task.children && task.children.length > 0" 
          class="toggle-arrow"
          :class="{ 'is-expanded': isExpanded }"
          @click="isExpanded = !isExpanded"
        >
          ▶
        </span>
        <span v-else class="arrow-placeholder"></span>
        
        <span class="task-content">{{ task.content }}</span>
      </div>
    </td>
    <td class="due-date-col">
      <!-- 2. 修改點：添加 .rounded-sm -->
      <span v-if="task.dueDate" class="due-date-text rounded-sm">{{ task.dueDate }}</span>
    </td>
    <td class="actions-col">
      <!-- 3. 修改點：整合 .button-reset -->
      <button 
        class="pin-button button-reset"
        :class="{ 'is-pinned': task.isPinned }"
        @click="handlePinClick"
        title="釘選到儀表板"
      >
        📌
      </button>
    </td>
  </tr>
  
  <template v-if="isExpanded">
    <TaskListItem
      v-for="childTask in task.children"
      :key="childTask.id"
      :task="childTask"
      :level="props.level + 1"
      @update-task="bubbleUpdate"
      @pin-task="bubblePin"
    />
  </template>
</template>

<style scoped>
.task-row:hover {
  background-color: var(--bg-tertiary);
}

.task-row td {
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle; 
}

.task-row.is-main-task {
  background-color: #527374a9;
  border-top: 2px solid var(--bg-tertiary);
}
.task-row.is-main-task:first-child {
  border-top: none;
}
.task-row:not(.is-main-task) {
  background-color: var(--bg-primary);
}

.status-col,
.due-date-col,
.actions-col {
  text-align: center;
}

.task-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  vertical-align: middle;
}

/* 4. 簡化點：移除 display:flex 和 align-items */
.task-content-wrapper {
  /* display: flex; align-items: center; */ /* <= 已由 .flex-center 取代 */
  gap: 6px;
  /* justify-content 預設為 flex-start，符合需求，不需額外設定 */
}

.toggle-arrow {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 10px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}
.toggle-arrow.is-expanded {
  transform: rotate(90deg);
}
.arrow-placeholder {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.task-content {
  color: var(--text-primary);
  font-size: 14px;
}

.task-row.is-completed .task-content {
  text-decoration: line-through;
  color: var(--text-secondary);
}

/* 5. 簡化點：移除 border-radius */
.due-date-text {
  font-size: 13px;
  color: var(--text-secondary);
  background-color: var(--bg-tertiary);
  padding: 2px 6px;
  /* border-radius: 4px; */ /* <= 已由 .rounded-sm 取代 */
}

/* 6. 簡化點：移除已被 .button-reset 取代的樣式 */
.pin-button {
  /* background, border, cursor 已移至 .button-reset */
  opacity: 0.3;
  transition: opacity 0.2s, transform 0.2s;
  font-size: 16px; 
  vertical-align: middle; 
}
.task-row:hover .pin-button {
  opacity: 0.6;
}
.pin-button:hover {
  opacity: 1;
  transform: scale(1.2);
}
.pin-button.is-pinned {
  opacity: 1;
}
</style>