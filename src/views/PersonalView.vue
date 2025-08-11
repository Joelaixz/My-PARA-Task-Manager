<script setup lang="ts">
// 匯入固定的、屬於 PersonalView 自身的元件
import WelcomeHeader from '../components/personal/WelcomeHeader.vue';

</script>

<template>
  <div class="personal-view-container">
    <WelcomeHeader />

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
  overflow-y: auto; /* 允許內容超出時垂直滾動 */
  background-color: var(--bg-primary);
  padding: 1.5rem;
  gap: 1.5rem;
}

/* 目的：定義主要儀表板區域的佈局 */
.main-dashboard {
  flex-grow: 1;
}
</style>