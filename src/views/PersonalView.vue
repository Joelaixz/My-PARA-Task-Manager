<script setup lang="ts">
// --- 1. 移除不再需要的子元件匯入 ---
// import TodoList from '../components/personal/TodoList.vue';
// import RecentFiles from '../components/personal/RecentFiles.vue';

// 匯入固定的、屬於 PersonalView 自身的元件
import WelcomeHeader from '../components/personal/WelcomeHeader.vue';
import QuickStats from '../components/personal/QuickStats.vue';
</script>

<template>
  <div class="personal-view-container">
    <WelcomeHeader />

    <QuickStats />
    
    <div class="main-dashboard">
      <RouterView />
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

/* 目的：定義主要儀表板區域的佈局 (樣式保持不變) */
/* 這裡的 padding 現在會作用於 <RouterView /> 渲染出來的內容 */
.main-dashboard {
  /* display: grid; */ /* display 屬性將由子路由元件 (DashboardHome) 自身控制 */
  gap: 1.5rem;
  padding: 0 2rem 2rem 2rem;
  /* align-items: start; */
}
</style>