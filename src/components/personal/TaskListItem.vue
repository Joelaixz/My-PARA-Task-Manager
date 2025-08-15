<script setup lang="ts">
// --- 1. Props & Emits ---
// 目的：定義元件如何從父元件接收資料 (props) 以及如何向父元件發送訊息 (emits)。

const props = defineProps<{
  task: ParsedTask; // 接收一個 ParsedTask 物件作為顯示的資料來源
}>();

const emit = defineEmits<{
  // 'update-task' 事件：當任務狀態（如完成與否）改變時觸發
  (e: 'update-task', payload: { id: string; isCompleted: boolean }): void;
  // 'pin-task' 事件：當任務的釘選狀態改變時觸發
  (e: 'pin-task', payload: { id: string; isPinned: boolean }): void;
}>();

// --- 2. 事件處理函式 ---
// 目的：將使用者的點擊操作轉換為具體的 emit 事件。

function handleCheckboxChange(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update-task', { id: props.task.id, isCompleted: target.checked });
}

function handlePinClick() {
  emit('pin-task', { id: props.task.id, isPinned: !props.task.isPinned });
}

// 目的：將子元件冒泡上來的事件，繼續向上傳遞給頂層的 TaskListView。
// 這是實現深層巢狀元件事件傳遞的關鍵。
function bubbleUpdate(payload: { id: string; isCompleted: boolean }) {
  emit('update-task', payload);
}

function bubblePin(payload: { id: string; isPinned: boolean }) {
  emit('pin-task', payload);
}
</script>

<template>
  <div class="task-item-container">
    <div class="task-item" :class="{ 'is-completed': task.isCompleted }">
      <input 
        type="checkbox" 
        :checked="task.isCompleted"
        class="task-checkbox"
        @change="handleCheckboxChange"
      />
      <span class="task-content">{{ task.content }}</span>
      <button 
        class="pin-button" 
        :class="{ 'is-pinned': task.isPinned }"
        @click="handlePinClick"
        title="釘選到儀表板"
      >
        📌
      </button>
    </div>
    
    <div v-if="task.children && task.children.length > 0" class="children-container">
      <TaskListItem
        v-for="childTask in task.children"
        :key="childTask.id"
        :task="childTask"
        @update-task="bubbleUpdate"
        @pin-task="bubblePin"
      />
    </div>
  </div>
</template>

<style scoped>
.task-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 6px 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}
.task-item:hover {
  background-color: var(--bg-tertiary);
}

.task-item.is-completed .task-content {
  text-decoration: line-through;
  color: var(--text-secondary);
  opacity: 0.8;
}

.task-checkbox {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.task-content {
  flex-grow: 1;
  color: var(--text-primary);
  font-size: 14px;
}

.pin-button {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.2s, transform 0.2s;
}
.task-item:hover .pin-button {
  opacity: 0.6;
}
.pin-button:hover {
  opacity: 1;
  transform: scale(1.2);
}
.pin-button.is-pinned {
  opacity: 1;
}

.children-container {
  padding-left: 28px; /* 創造巢狀的縮排效果 */
}
</style>