<script setup lang="ts">
// 目的：此元件負責顯示日曆的月份標題和導航按鈕。
// 在此階段，它依然是一個靜態元件，但為將來的動態功能預留了結構。

// 未來的 Props 將用於接收當前的月份和年份資訊。
// 未來的 Emits 將用於發出「切換月份」的事件。
</script>

<template>
  <div class="calendar-header">
    <button class="nav-button button-reset interactive-item rounded-sm">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
      </svg>
    </button>
    
    <h2 class="month-title">2025 年 8 月</h2>
    
    <button class="nav-button button-reset interactive-item rounded-sm">
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