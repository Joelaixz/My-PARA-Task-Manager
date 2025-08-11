<script setup lang="ts">
// 目的：匯入儀表板的兩個主要微件(Widget)。
import TodoList from './TodoList.vue';
import RecentFiles from './RecentFiles.vue';
</script>

<template>
  <div class="dashboard-home-grid">
    <TodoList />
    <RecentFiles />
  </div>
</template>

<style scoped>
/* 目的：這些樣式也完全複製自 PersonalView.vue，以確保外觀不變 */
.dashboard-home-grid {
  display: grid;
  /* 建立一個兩欄佈局
     - `minmax(0, 2fr)`: 左側欄 (TodoList) 最小為0，最大佔用 2 個單位空間。
     - `minmax(0, 1fr)`: 右側欄 (RecentFiles) 最小為0，最大佔用 1 個單位空間。
     - 這會讓左欄寬度大約是右欄的兩倍。
  */
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 1.5rem; /* 微件之間的間距 */
  align-items: start; /* 讓不同高度的微件從頂部對齊 */
}

/* --- 響應式設計 --- */
/* 目的：當視窗寬度小於 900px 時，將兩欄佈局改為單欄堆疊 */
@media (max-width: 900px) {
  .dashboard-home-grid {
    grid-template-columns: minmax(0, 1fr); /* 變為單欄 */
  }
}
</style>