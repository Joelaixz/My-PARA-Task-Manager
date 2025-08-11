<script setup lang="ts">
import { ref, onMounted } from 'vue';

// --- 響應式資料 ---
// 目的：儲存格式化後的日期字串，以便在模板中顯示。
const formattedDate = ref('');

// --- 生命週期鉤子 ---
onMounted(() => {
  // 目的：在元件掛載到畫面上後，計算並設定今天的日期。
  // 說明：這樣做可以確保我們使用的是使用者當下的日期，而不是伺服器渲染或建置時的日期。
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  };
  // 使用 Intl.DateTimeFormat 來取得符合使用者地區的、更具可讀性的日期格式。
  // 'zh-TW' 表示使用台灣的中文格式。
  formattedDate.value = new Intl.DateTimeFormat('zh-TW', options).format(today);
});
</script>

<template>
  <div class="welcome-header">
    <div class="title-group">
      <h1 class="main-title">個人儀表板</h1>
      <p class="subtitle">歡迎回來！集中管理您今天的焦點。</p>
    </div>
    <div class="date-display">
      <span>{{ formattedDate }}</span>
    </div>
  </div>
</template>

<style scoped>
/* 目的：定義歡迎標題區域的整體樣式 */
.welcome-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* 讓元素從頂部對齊 */
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color); /* 與側邊欄一致的分隔線 */
  background-color: var(--bg-secondary); /* 使用次要背景色以和主內容區區分 */
  color: var(--text-primary);
}

.title-group {
  display: flex;
  flex-direction: column;
}

.main-title {
  margin: 0;
  font-size: 1.75rem; /* 28px */
  font-weight: 600;
  color: var(--text-primary);
}

.subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.9rem; /* 14px */
  color: var(--text-secondary);
  font-weight: 400;
}

.date-display {
  font-size: 0.9rem; /* 14px */
  color: var(--text-secondary);
  background-color: var(--bg-primary); /* 使用更深的背景色創造層次感 */
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  align-self: center; /* 讓日期在垂直方向上居中於 flex 容器 */
}
</style>