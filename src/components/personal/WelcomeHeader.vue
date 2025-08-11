<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useMainStore } from '../../store';

const mainStore = useMainStore();

// --- 模擬資料 ---
// 目的：為進度條提供一個模擬的動態資料來源。
// 未來這個資料可以從您的任務管理 store 中真實獲取。
const completedTasks = ref(3);
const totalTasks = ref(7);

const taskProgress = computed(() => {
  if (totalTasks.value === 0) return 0;
  return (completedTasks.value / totalTasks.value) * 100;
});

// --- 動態標題邏輯 (保持不變) ---
const mainTitle = computed(() => {
  return mainStore.activePersonalView;
});

const subtitle = computed(() => {
  switch (mainStore.activePersonalView) {
    case '今日焦點':
      return '整理思緒，從這裡開始新的一天。';
    case '任務清單':
      return '一步一步，完成您的目標。';
    case '未來日誌':
      return '記錄靈感，規劃您的下一步。';
    default:
      return '一個好的開始，是成功的一半。';
  }
});

// --- 日期格式化 (新增星期幾) ---
const formattedDate = ref('');
onMounted(() => {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long' // 新增星期，提供更完整的時間資訊
  };
  formattedDate.value = new Intl.DateTimeFormat('zh-TW', options).format(today);
});
</script>

<template>
  <div class="header-card">
    <div class="top-section">
      <div class="title-group">
        <p class="date-display">{{ formattedDate }}</p>
        <h1 class="main-title">{{ mainTitle }}</h1>
        <p class="subtitle">{{ subtitle }}</p>
      </div>

      <div class="actions-group">
        <button class="action-button primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg>
          <span>新增筆記</span>
        </button>
        <button class="action-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
          <span>新增任務</span>
        </button>
      </div>
    </div>

    <div class="progress-section">
      <div class="progress-info">
        <span class="progress-label">今日任務進度</span>
        <span class="progress-text">{{ completedTasks }} / {{ totalTasks }}</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fg" :style="{ width: taskProgress + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header-card {
  padding: 1.5rem 2.5rem;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px; /* 更大的圓角 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); /* 增加立體感 */
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* 上下兩區的間距 */
}

/* --- 上半部分 --- */
.top-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
}

.title-group {
  text-align: left;
}

.date-display {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.main-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-primary);
}

.subtitle {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  max-width: 400px;
}

.actions-group {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0; /* 防止按鈕被壓縮 */
  padding-top: 0.25rem; /* 微調與頂部對齊 */
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  border-color: var(--color-personal);
  color: var(--text-primary);
}

.action-button.primary {
  background-color: var(--bg-section-personal);
  border-color: var(--color-personal);
  color: var(--text-primary);
}
.action-button.primary:hover {
  background-color: var(--color-personal);
  color: var(--text-accent-contrast);
}

/* --- 下半部分 --- */
.progress-section {
  width: 100%;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.progress-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}

.progress-bar-bg {
  width: 100%;
  height: 8px;
  background-color: var(--bg-primary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fg {
  height: 100%;
  background-color: var(--color-personal);
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* 響應式設計：小螢幕時，標題和按鈕垂直堆疊 */
@media (max-width: 768px) {
  .top-section {
    flex-direction: column;
    align-items: stretch;
  }
  .actions-group {
    justify-content: flex-start;
  }
}
</style>