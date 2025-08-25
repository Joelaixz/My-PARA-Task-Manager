<script setup lang="ts">
import { ref, computed } from 'vue';

// 目的：定義元件將發出的事件
// @update-month-year: 當使用者點擊切換月份按鈕時發出，攜帶新的月份與年份
const emit = defineEmits<{
  (e: 'update-month-year', date: { year: number, month: number }): void;
}>();

// --- 1. 定義響應式狀態 ---
// 目的：使用 ref 來儲存和追蹤當前顯示的年份和月份。
const today = new Date();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth()); // JavaScript 的月份是從 0-11

// --- 2. 建立動態計算屬性 ---
// 目的：根據當前的年份和月份，格式化成易讀的標題。
const monthTitle = computed(() => {
  // `zh-TW` 確保月份名稱以中文顯示
  const options = { year: 'numeric', month: 'long' } as const;
  const formattedDate = new Date(currentYear.value, currentMonth.value).toLocaleDateString('zh-TW', options);
  return formattedDate;
});

// --- 3. 實作事件處理函式 ---
// 目的：點擊按鈕時更新月份狀態，並發出事件通知父元件。
function changeMonth(delta: number) {
  const newDate = new Date(currentYear.value, currentMonth.value + delta);
  currentYear.value = newDate.getFullYear();
  currentMonth.value = newDate.getMonth();
  // 發出事件，將新的年份和月份傳遞出去
  emit('update-month-year', {
    year: currentYear.value,
    month: currentMonth.value,
  });
}
</script>

<template>
  <div class="calendar-header">
    <button 
      class="nav-button button-reset interactive-item rounded-sm"
      @click="changeMonth(-1)"
      title="上一個月"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
      </svg>
    </button>
    
    <h2 class="month-title">{{ monthTitle }}</h2>
    
    <button 
      class="nav-button button-reset interactive-item rounded-sm"
      @click="changeMonth(1)"
      title="下一個月"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1rem;
}

.month-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.nav-button {
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--text-secondary);
}
</style>