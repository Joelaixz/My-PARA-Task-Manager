<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useMainStore } from '../../../store';

const mainStore = useMainStore();

const formattedDate = computed(() => {
  if (!mainStore.urgentCalendarEvent || !mainStore.urgentCalendarEvent.date) return '';
  const date = new Date(mainStore.urgentCalendarEvent.date);
  const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * -60000));
  const options = { month: 'long', day: 'numeric' } as const;
  return new Intl.DateTimeFormat('zh-TW', options).format(localDate);
});

// 1. 新增：倒數計時器的響應式狀態與邏輯
const countdownDisplay = ref('');
let countdownInterval: number | undefined = undefined;

/**
 * 目的：更新倒數計時器顯示。
 */
function updateCountdown() {
  const targetEvent = mainStore.urgentCalendarEvent;
  if (!targetEvent || !targetEvent.date) {
    countdownDisplay.value = '';
    return;
  }
  
  const targetDate = new Date(targetEvent.date);
  const now = new Date();
  const targetLocalDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  
  const distance = targetLocalDate.getTime() - now.getTime();

  if (distance < 0) {
    countdownDisplay.value = '已截止';
    clearInterval(countdownInterval);
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  countdownDisplay.value = `${days}天 ${hours}小時`;
}

onMounted(() => {
  mainStore.fetchPinnedCalendarEvents();
  watch(() => mainStore.urgentCalendarEvent, () => {
    updateCountdown();
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    // 2. 修正：將倒數計時更新頻率改為每秒
    countdownInterval = window.setInterval(updateCountdown, 1000);
  }, { immediate: true });
});

onUnmounted(() => {
  clearInterval(countdownInterval);
});

</script>

<template>
  <div class="board-note urgent-pin-card">
    <h2 class="note-title">🔥 最急迫事項</h2>
    <template v-if="mainStore.urgentCalendarEvent">
      <p class="pin-title">{{ mainStore.urgentCalendarEvent.title }}</p>
      <div class="pin-footer">
        <span class="pin-date">{{ formattedDate }}</span>
        <span class="pin-countdown">{{ countdownDisplay }}</span>
      </div>
    </template>
    <template v-else>
      <div class="placeholder-content">
        <p class="placeholder-text">點擊「未來日誌」在日曆中釘選</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.board-note {
  grid-column: span 3;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  min-height: 180px;
}
.urgent-pin-card {
  border-left: 4px solid var(--color-personal);
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
.pin-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--text-primary);
  flex-grow: 1;
}
.pin-footer {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.pin-date {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--color-personal);
}
.pin-countdown {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-personal);
}
.placeholder-content {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.placeholder-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-align: center;
}
</style>