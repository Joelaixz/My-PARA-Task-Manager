<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import FocusCard from './dashboard/FocusCard.vue';
import ScratchpadCard from './dashboard/ScratchpadCard.vue';
// --- 1. 匯入新的 TodayTasks 元件 ---
import TodayTasksCard from './dashboard/TodayTasksCard.vue';


// --- 2. 移除舊的 todayTasks 假資料 ---
// const todayTasks = ref([...]);

const urgentCountdown = ref({
  targetDate: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), 
  title: '「專案B」第一階段交付',
});

const futureReminder = ref({
  date: '8月25日',
  event: '參加技術分享會',
});

// --- 倒數計時器邏輯 ---
const countdownDisplay = ref('');
let countdownInterval: number;

function updateCountdown() {
  const now = new Date().getTime();
  const distance = urgentCountdown.value.targetDate.getTime() - now;

  if (distance < 0) {
    countdownDisplay.value = '已截止';
    clearInterval(countdownInterval);
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  
  countdownDisplay.value = `${days}天 ${hours}小時 ${minutes}分`;
}

onMounted(() => {
  updateCountdown();
  countdownInterval = window.setInterval(updateCountdown, 1000 * 60);
});

onUnmounted(() => {
  clearInterval(countdownInterval);
});

</script>

<template>
  <div class="dashboard-grid">
    
    <FocusCard />

    <div class="board-note countdown-card">
      <h2 class="note-title">🔥 最急迫事項</h2>
      <p class="countdown-title">{{ urgentCountdown.title }}</p>
      <div class="countdown-timer">{{ countdownDisplay }}</div>
    </div>

    <div class="board-note reminder-card">
       <h2 class="note-title">🗓️ 未來提醒</h2>
       <p class="reminder-date">{{ futureReminder.date }}</p>
       <p class="reminder-event">{{ futureReminder.event }}</p>
    </div>

    <TodayTasksCard />

    <ScratchpadCard />

  </div>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
}

/* 註解：移除 .board-note 的樣式，因為所有卡片都已經是獨立元件，
   各自管理自己的樣式，父元件只需要負責網格佈局即可。 */

.note-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

/* --- 4. 修改點：使用 :deep() 選擇器將 Grid 佈局應用到子元件的根元素上 --- */
:deep(.focus-card) {
  grid-column: span 6;
}
:deep(.scratchpad-card) {
  grid-column: span 6;
}
:deep(.tasks-card) {
  grid-column: span 6;
}


/* 倒數計時卡片 (暫時保留，未來也應元件化) */
.countdown-card {
  grid-column: span 3;
  border-left: 4px solid var(--color-projects);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
}
.countdown-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
}
.countdown-timer {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-projects);
  letter-spacing: 1px;
  margin-top: auto;
}

/* 提醒卡片 (暫時保留，未來也應元件化) */
.reminder-card {
  grid-column: span 3;
  border-left: 4px solid var(--color-areas);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
}
.reminder-date {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-areas);
  margin: 0 0 0.5rem 0;
}
.reminder-event {
  font-size: 0.9rem;
  color: var(--text-primary);
  margin: 0;
  margin-top: auto;
}


/* 確保所有卡片都有最小高度 */
:deep(.focus-card),
:deep(.scratchpad-card),
:deep(.tasks-card),
.countdown-card, 
.reminder-card {
  min-height: 180px;
}
</style>