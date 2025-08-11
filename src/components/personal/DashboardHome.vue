<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

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

const mainFocus = ref('完成 WelcomeHeader 的最終設計稿，並交付給開發團隊。');
const scratchpadContent = ref('');

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
    
    <div class="board-note focus-card">
      <h2 class="note-title">📌 今日首要目標 (MIT)</h2>
      <p class="focus-text">{{ mainFocus }}</p>
    </div>

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

    <div class="board-note scratchpad-card">
       <h2 class="note-title">✍️ 隨手筆記</h2>
       <div class="textarea-wrapper">
         <textarea v-model="scratchpadContent" placeholder="隨時記錄靈感..."></textarea>
       </div>
    </div>

  </div>
</template>

<style scoped>
/* --- 1. 全新的固定網格佈局 --- */
.dashboard-grid {
  display: grid;
  /* 建立一個 12 欄位的網格系統 */
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
}

/* --- 2. 統一卡片樣式 --- */
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
  flex-shrink: 0; /* 防止標題被壓縮 */
}

/* --- 3. 卡片佈局與裝飾 --- */

/* 首要目標卡片：佔據 6/12 欄位 */
.focus-card {
  grid-column: span 6;
  border-left: 4px solid var(--color-personal);
}
.focus-text {
  font-size: 1.1rem;
  color: var(--text-primary);
  line-height: 1.6;
  margin: 0;
}

/* 倒數計時卡片：佔據 3/12 欄位 */
.countdown-card {
  grid-column: span 3;
  border-left: 4px solid var(--color-projects); /* 使用專案主題色 */
}
.countdown-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
}
.countdown-timer {
  font-size: 1.8rem; /* 微調大小 */
  font-weight: 700;
  color: var(--color-projects);
  letter-spacing: 1px;
  margin-top: auto; /* 將計時器推到底部 */
}

/* 提醒卡片：佔據 3/12 欄位 */
.reminder-card {
  grid-column: span 3;
  border-left: 4px solid var(--color-areas); /* 使用領域主題色 */
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
  margin-top: auto; /* 將事件推到底部 */
}

/* 任務列表卡片：佔據 6/12 欄位 */
.tasks-card {
  grid-column: span 6;
  border-left: 4px solid var(--color-resources); /* 使用資源主題色 */
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
  margin-top: auto; /* 將連結推到底部 */
}
.view-all-link:hover { text-decoration: underline; }

/* 隨手筆記卡片：佔據 6/12 欄位 */
.scratchpad-card {
  grid-column: span 6;
  border-left: 4px solid var(--color-archives); /* 使用封存主題色 */
}
/* 4. 修正 Textarea 間距 */
.textarea-wrapper {
  flex-grow: 1; /* 讓 wrapper 填滿剩餘空間 */
  display: flex;
}
.scratchpad-card textarea {
  width: 100%;
  flex-grow: 1; /* 讓 textarea 填滿 wrapper */
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  padding: 0.75rem;
  font-family: inherit;
  font-size: 0.9rem;
  resize: none; /* 通常儀表板的便利貼不需要調整大小 */
}
.scratchpad-card textarea:focus {
  outline: none;
  border-color: var(--color-archives);
}

/* --- 5. 統一部分卡片的高度 --- */
.focus-card, .countdown-card, .reminder-card {
  min-height: 180px; /* 設定一個最小且一致的高度 */
}
</style>