<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useMainStore } from '../../../store';

const mainStore = useMainStore();

// 目的：格式化日期，使其更易讀
const formattedDate = computed(() => {
  if (!mainStore.futureReminderEvent || !mainStore.futureReminderEvent.date) return '';
  const date = new Date(mainStore.futureReminderEvent.date);
  const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * -60000));
  // 只顯示月和日
  const options = { month: 'long', day: 'numeric' } as const;
  return new Intl.DateTimeFormat('zh-TW', options).format(localDate);
});

// 為什麼：即使這個元件不直接使用 fetchPinnedCalendarEvents 的結果，
//         也需要在 onMounted 中呼叫它，以確保當使用者直接打開儀表板時，
//         釘選事件的狀態能被正確地初始化。
onMounted(() => {
  mainStore.fetchPinnedCalendarEvents();
});
</script>

<template>
  <div class="board-note reminder-card">
    <h2 class="note-title">🗓️ 未來提醒</h2>
    <template v-if="mainStore.futureReminderEvent">
      <p class="pin-title">{{ mainStore.futureReminderEvent.title }}</p>
      <p class="pin-date">{{ formattedDate }}</p>
    </template>
    <template v-else>
      <div class="placeholder-content">
        <p class="placeholder-text">點擊「未來日誌」在日曆中釘選</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* 2. 修改：統一並優化卡片樣式 (與 UrgentPinCard.vue 相同) */
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
.reminder-card {
  border-left: 4px solid var(--color-areas);
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
.pin-date {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--color-areas);
  margin: 0;
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