<script setup lang="ts">
// --- 1. 匯入所有我們建立的儀表板元件 ---
import WelcomeHeader from '../components/personal/WelcomeHeader.vue';
import QuickStats from '../components/personal/QuickStats.vue';
import TodoList from '../components/personal/TodoList.vue';
import RecentFiles from '../components/personal/RecentFiles.vue';
</script>

<template>
  <div class="personal-view-container">
    <WelcomeHeader />

    <QuickStats />
    
    <div class="main-dashboard">
      <TodoList />
      <RecentFiles />
    </div>
  </div>
</template>

<style scoped>
/* 目的：定義 PersonalView 的主容器樣式 */
.personal-view-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: auto; /* 允許內容超出時垂直滾動 */
  background-color: var(--bg-primary);
}

/* 目的：定義主要儀表板區域的佈局 */
.main-dashboard {
  display: grid;
  /* 建立一個兩欄佈局
     - `minmax(0, 2fr)`: 左側欄 (TodoList) 最小為0，最大佔用 2 個單位空間。
     - `minmax(0, 1fr)`: 右側欄 (RecentFiles) 最小為0，最大佔用 1 個單位空間。
     - 這會讓左欄寬度大約是右欄的兩倍。
  */
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 1.5rem; /* 微件之間的間距 */
  padding: 0 2rem 2rem 2rem; /* 左右和底部的內邊距 */
  align-items: start; /* 讓不同高度的微件從頂部對齊 */
}

/* --- 響應式設計 --- */
/* 目的：當視窗寬度小於 900px 時，將兩欄佈局改為單欄堆疊 */
@media (max-width: 900px) {
  .main-dashboard {
    grid-template-columns: minmax(0, 1fr); /* 變為單欄 */
  }
}
</style>