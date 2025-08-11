<script setup lang="ts">
import { ref } from 'vue';

// --- 介面定義 ---
// 目的：為待辦事項的資料結構定義一個型別。
interface TodoItem {
  id: number;
  text: string;
  done: boolean;
}

// --- 假資料 (Mock Data) ---
// 目的：提供一個包含已完成和未完成項目的靜態任務列表。
const todos = ref<TodoItem[]>([
  { id: 1, text: '整理專案 A 的初步構想筆記', done: false },
  { id: 2, text: '回覆來自設計團隊的 Email', done: false },
  { id: 3, text: '完成上週的週報並封存', done: true },
  { id: 4, text: '預約下午三點的團隊同步會議', done: false },
  { id: 5, text: '閱讀關於 Vue 3 Composition API 的新文章', done: true },
]);
</script>

<template>
  <div class="todo-list-widget">
    <div class="widget-header">
      <h3 class="widget-title">今日任務清單</h3>
      <button class="add-task-btn">+</button>
    </div>
    <ul class="todo-list">
      <li 
        v-for="todo in todos" 
        :key="todo.id" 
        class="todo-item"
        :class="{ 'is-done': todo.done }"
      >
        <input 
          type="checkbox" 
          :id="`todo-${todo.id}`" 
          :checked="todo.done" 
          class="todo-checkbox"
        />
        <label :for="`todo-${todo.id}`" class="todo-label">{{ todo.text }}</label>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* 目的：定義整個待辦事項微件的容器樣式 */
.todo-list-widget {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  /* margin 是為了在 grid 佈局中與其他元件隔開，稍後會在 PersonalView 中統一處理 */
}

/* 目的：定義微件頂部標題和按鈕的佈局 */
.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.widget-title {
  margin: 0;
  font-size: 1.1rem; /* 18px */
  font-weight: 600;
  color: var(--text-primary);
}

.add-task-btn {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 20px;
  line-height: 26px; /* 微調 '+' 的垂直位置 */
  cursor: pointer;
  transition: all 0.2s;
}
.add-task-btn:hover {
  background-color: var(--accent-color);
  color: var(--text-accent-contrast);
  transform: rotate(90deg);
}

/* 目的：定義任務列表的樣式 */
.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* 目的：定義單一任務項目的樣式 */
.todo-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
  transition: opacity 0.3s;
}
/* 最後一項不要底線 */
.todo-item:last-child {
  border-bottom: none;
}

/* 目的：為已完成的任務提供視覺回饋 */
.todo-item.is-done .todo-label {
  text-decoration: line-through;
  color: var(--text-secondary);
}
.todo-item.is-done {
  opacity: 0.7;
}

.todo-checkbox {
  /* 放大 checkbox 並美化 */
  appearance: none;
  -webkit-appearance: none;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  width: 18px;
  height: 18px;
  border-radius: 4px;
  margin-right: 0.75rem;
  cursor: pointer;
  position: relative;
  flex-shrink: 0; /* 防止被壓縮 */
}
.todo-checkbox:checked {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
}
/* 使用偽元素 ::after 來建立勾勾圖案 */
.todo-checkbox:checked::after {
  content: '✔';
  position: absolute;
  color: var(--text-accent-contrast);
  font-size: 12px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.todo-label {
  color: var(--text-primary);
  font-size: 0.9rem; /* 14px */
  line-height: 1.4;
  transition: color 0.3s;
}
</style>