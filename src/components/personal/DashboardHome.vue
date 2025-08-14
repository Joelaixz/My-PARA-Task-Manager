<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
// --- 1. 匯入 FocusCard 和新的 ScratchpadCard 元件 ---
import FocusCard from './dashboard/FocusCard.vue';
import ScratchpadCard from './dashboard/ScratchpadCard.vue';

// --- 模擬資料 (Mock Data) ---
const todayTasks = ref([
  { id: 1, text: '回覆設計團隊的 Email', done: false },
  { id: 2, text: '草擬「專案A」的初步構想', done: true },
  { id: 3, text: '預約下午三點的團隊會議', done: false },
  { id: 4, text: '研究新的 Vite 外掛程式', done: false },
]);

const urgentCountdown = ref({
  targetDate: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), 
  title: '「專案B」第一階段交付',
});

const futureReminder = ref({
  date: '8月25日',
  event: '參加技術分享會',
});

// --- 2. 移除舊的 scratchpadContent 假資料 ---
// const scratchpadContent = ref('');

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

    <div class="board-note tasks-card">
      <h2 class="note-title">📋 今日任務清單</h2>
      <ul class="task-list">
        <li v-for="task in todayTasks" :key="task.id" :class="{ 'is-done': task.done }">
          <span class="checkbox-icon">{{ task.done ? '✅' : '⬜️' }}</span>
          <span class="task-text">{{ task.text }}</span>
        </li>
      </ul>
      <a href="#" class="view-all-link">查看完整清單...</a>
    </div>

    <ScratchpadCard />

  </div>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
}

.board-note {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
}

.note-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

/* --- 4. 移除舊的 scratchpad-card 相關樣式 --- */

/* Grid 佈局設定 */
:deep(.focus-card) {
  grid-column: span 6;
}
:deep(.scratchpad-card) {
  grid-column: span 6;
}

/* 倒數計時卡片 */
.countdown-card {
  grid-column: span 3;
  border-left: 4px solid var(--color-projects);
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

/* 提醒卡片 */
.reminder-card {
  grid-column: span 3;
  border-left: 4px solid var(--color-areas);
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

/* 任務列表卡片 */
.tasks-card {
  grid-column: span 6;
  border-left: 4px solid var(--color-resources);
}
.task-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
}
.task-list li {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.9rem;
}
.task-list li.is-done .task-text {
  text-decoration: line-through;
  opacity: 0.6;
}
.checkbox-icon {
  margin-right: 0.75rem;
}
.view-all-link {
  font-size: 0.8rem;
  color: var(--link-color);
  text-decoration: none;
  margin-top: auto;
}
.view-all-link:hover { text-decoration: underline; }

/* 確保所有卡片都有最小高度 */
:deep(.focus-card),
:deep(.scratchpad-card),
.countdown-card, 
.reminder-card {
  min-height: 180px;
}
</style>