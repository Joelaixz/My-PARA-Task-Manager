<script setup lang="ts">
// 目的：此元件負責顯示日曆的星期表頭和所有日期格子。
// 在此階段，它依然是一個靜態元件，使用 v-for 迴圈來模擬日曆的月份。
</script>

<template>
  <div class="calendar-grid-container">
    <div class="weekday-header">日</div>
    <div class="weekday-header">一</div>
    <div class="weekday-header">二</div>
    <div class="weekday-header">三</div>
    <div class="weekday-header">四</div>
    <div class="weekday-header">五</div>
    <div class="weekday-header">六</div>

    <div class="day-cell" v-for="n in 31" :key="n">
      <span class="day-number">{{ n }}</span>
    </div>
  </div>
</template>

<style scoped>
.calendar-grid-container {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}

.weekday-header {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.5rem;
}

.day-cell {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.5rem;
  min-height: 100px;
  position: relative;
  transition: background-color 0.2s;
}
.day-cell:hover {
  background-color: var(--bg-tertiary);
}

.day-number {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}
</style>