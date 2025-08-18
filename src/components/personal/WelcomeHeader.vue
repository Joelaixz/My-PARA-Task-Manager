<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useMainStore } from '../../store';

const mainStore = useMainStore();

// --- (任務進度、標題、副標題的邏輯保持不變) ---
const completedTasks = computed(() => mainStore.completedPinnedTasks);
const totalTasks = computed(() => mainStore.totalPinnedTasks);
const taskProgress = computed(() => {
  if (totalTasks.value === 0) return 0;
  return (completedTasks.value / totalTasks.value) * 100;
});
const mainTitle = computed(() => mainStore.activePersonalView);
const subtitle = computed(() => {
  switch (mainStore.activePersonalView) {
    case '今日焦點': return '整理思緒，從這裡開始新的一天。';
    case '任務清單': return '一步一步，完成您的目標。';
    case '未來日誌': return '記錄靈感，規劃您的下一步。';
    default: return '一個好的開始，是成功的一半。';
  }
});

// --- 1. 修改點：新增時間狀態，並調整日期格式 ---
const calendarMonth = ref('');
const calendarDay = ref('');
const calendarWeekday = ref('');
const currentTime = ref('');
let timerId: number | null = null;

onMounted(() => {
  const updateDateTime = () => {
    const now = new Date();
    calendarMonth.value = (now.getMonth() + 1).toString().padStart(2, '0');
    calendarDay.value = now.getDate().toString().padStart(2, '0');
    calendarWeekday.value = now.toLocaleDateString('zh-TW', { weekday: 'long' });
    currentTime.value = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  updateDateTime();
  // 每秒更新一次時間
  timerId = window.setInterval(updateDateTime, 1000);
});

// 為什麼：在元件卸載時清除計時器，是防止記憶體洩漏和不必要背景任務的關鍵步驟。
onUnmounted(() => {
  if (timerId) {
    clearInterval(timerId);
  }
});
</script>

<template>
  <div class="header-card">
    <div class="top-section">
      <div class="title-group">
        <h1 class="main-title">{{ mainTitle }}</h1>
        <p class="subtitle">{{ subtitle }}</p>
      </div>

      <div class="date-time-widget">
        <div class="date-part">
          <span class="month-day">{{ calendarMonth }} / {{ calendarDay }}</span>
          <span class="weekday">{{ calendarWeekday }}</span>
        </div>
        <div class="time-part">
          {{ currentTime }}
        </div>
      </div>
    </div>

    <div v-if="mainStore.activePersonalView === '今日焦點'" class="progress-section">
      <div class="progress-info">
        <span class="progress-label">今日釘選任務進度</span>
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
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  /* 為什麼：設定一個最小高度，確保在沒有進度條時，Header 不會縮小，維持佈局穩定。*/
  min-height: 140px; 
}

.top-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.title-group {
  text-align: left;
  flex-grow: 1;
}

.main-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  max-width: 400px;
}

/* --- 3. 新增點：日期時間元件的全新樣式 --- */
.date-time-widget {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  background-color: var(--bg-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.date-part {
  padding: 0.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  border-right: 1px solid var(--border-color);
}

.month-day {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

.weekday {
  margin: auto;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.time-part {
  padding: 0 1.25rem;
  font-size: 1.75rem;
  font-weight: 500;
  color: var(--color-personal);
  font-family: 'Courier New', Courier, monospace;
  letter-spacing: 1px;
}

.progress-section { 
  width: 100%;
  padding-top: 1rem; /* 增加與上方內容的間距 */
  border-top: 1px solid var(--border-color); /* 新增分隔線，讓佈局更清晰 */
}
.progress-info { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem; }
.progress-label { font-size: 0.8rem; color: var(--text-secondary); }
.progress-text { font-size: 0.9rem; font-weight: 500; color: var(--text-primary); }
.progress-bar-bg { width: 100%; height: 8px; background-color: var(--bg-primary); border-radius: 4px; overflow: hidden; }
.progress-bar-fg { height: 100%; background-color: var(--color-personal); border-radius: 4px; transition: width 0.5s ease; }

@media (max-width: 768px) {
  .top-section {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  .title-group {
    margin-bottom: 0.5rem;
  }
  .date-time-widget {
    justify-content: space-between;
  }
}
</style>