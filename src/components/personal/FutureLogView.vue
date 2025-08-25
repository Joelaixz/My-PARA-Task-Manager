<script setup lang="ts">
// 目的：此元件為未來日誌頁面的主容器。
// 現在它將組合 CalendarHeader 和 CalendarGrid 這兩個子元件。
import CalendarHeader from './future-log/CalendarHeader.vue';
// 1. 新增：匯入 CalendarGrid 元件
import CalendarGrid from './future-log/CalendarGrid.vue';

</script>

<template>
  <div class="future-log-container">
    <div class="page-actions">
      </div>
    <div class="calendar-wrapper">
      <CalendarHeader />

      <CalendarGrid />
    </div>
  </div>
</template>

<style scoped>
.future-log-container {
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

.calendar-wrapper {
  flex-grow: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

/* 3. 移除：所有與日曆網格相關的樣式，因為它們已被移至 CalendarGrid.vue 中 */
</style>