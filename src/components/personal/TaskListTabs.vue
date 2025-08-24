// 檔案位置: src/components/personal/TaskListTabs.vue
<script setup lang="ts">
import { ref } from 'vue';

interface TaskList {
  id: number;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
  display_order: number;
}

const props = defineProps<{
  taskLists: TaskList[];
  activeListId: number | null;
}>();

const emit = defineEmits<{
  (e: 'switch-tab', listId: number): void;
  (e: 'new-tab'): void;
  (e: 'close-tab', listId: number): void;
  (e: 'reorder-tabs', newLists: TaskList[]): void;
}>();

const draggedItemId = ref<number | null>(null);

function handleSwitch(listId: number) {
  emit('switch-tab', listId);
}
function handleNew() {
  emit('new-tab');
}
function handleClose(event: MouseEvent, listId: number) {
  event.stopPropagation(); 
  emit('close-tab', listId);
}

function onDragStart(event: DragEvent, listId: number) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(listId));
  }
  draggedItemId.value = listId;
}
function onDragOver(event: DragEvent) {
  event.preventDefault(); 
}
function onDrop(event: DragEvent, targetListId: number) {
  event.preventDefault();
  if (draggedItemId.value === null) return;

  const sourceId = draggedItemId.value;
  const targetId = targetListId;

  if (sourceId === targetId) return;

  const listsCopy = [...props.taskLists];
  const sourceIndex = listsCopy.findIndex(list => list.id === sourceId);
  const targetIndex = listsCopy.findIndex(list => list.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1) return;

  const [draggedItem] = listsCopy.splice(sourceIndex, 1);
  listsCopy.splice(targetIndex, 0, draggedItem);

  emit('reorder-tabs', listsCopy);

  draggedItemId.value = null;
}
function onDragEnd() {
  draggedItemId.value = null;
}
</script>

<template>
  <div class="task-tabs-container">
    <div class="tabs-wrapper">
      <!-- 1. 修改點：添加 .button-reset -->
      <button
        v-for="list in taskLists"
        :key="list.id"
        class="tab-item button-reset"
        :class="{ 
          'is-active': list.id === activeListId,
          'is-dragging': list.id === draggedItemId
        }"
        @click="handleSwitch(list.id)"
        :title="list.name"
        draggable="true"
        @dragstart="onDragStart($event, list.id)"
        @dragover="onDragOver($event)"
        @drop="onDrop($event, list.id)"
        @dragend="onDragEnd"
      >
        <span class="tab-name">{{ list.name }}</span>
        <span
          v-if="taskLists.length > 1"
          class="close-tab-btn"
          @click="handleClose($event, list.id)"
          title="關閉清單"
        >
          ×
        </span>
      </button>
    </div>

    <!-- 2. 修改點：添加 .button-reset -->
    <button class="new-tab-btn button-reset" @click="handleNew" title="新增任務清單">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.task-tabs-container {
  display: flex;
  align-items: center;
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  padding: 0.5rem 1rem;
  flex-shrink: 0;
  gap: 0.75rem;
}

.tabs-wrapper {
  display: flex;
  flex-grow: 1;
  overflow-x: auto;
  gap: 0.5rem;
  scrollbar-width: none;
}
.tabs-wrapper::-webkit-scrollbar {
  display: none;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  padding: 8px 12px;
  white-space: nowrap;
  transition: all 0.2s ease;
  /* cursor 已由 .button-reset 提供 */
}

.tab-item:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.tab-item.is-active {
  background-color: var(--accent-color-muted);
  color: var(--text-primary);
  font-weight: 500;
  border-bottom-color: var(--accent-color-muted);
  margin-bottom: -1px;
}


.tab-item.is-dragging {
  opacity: 0.5;
  background-color: var(--accent-color-muted);
}

.tab-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.close-tab-btn {
  font-size: 1.2rem;
  line-height: 1;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}
.tab-item:hover .close-tab-btn {
  color: var(--text-primary);
}
.close-tab-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #f87171;
}
.new-tab-btn {
  flex-shrink: 0;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* cursor 已由 .button-reset 提供 */
}
.new-tab-btn:hover {
  background-color: var(--accent-color);
  color: var(--text-accent-contrast);
}
</style>