<script setup lang="ts">
import FocusCard from './dashboard/FocusCard.vue';
import ScratchpadCard from './dashboard/ScratchpadCard.vue';
import TodayTasksCard from './dashboard/TodayTasksCard.vue';
import UrgentPinCard from './dashboard/UrgentPinCard.vue';
import FutureReminderCard from './dashboard/FutureReminderCard.vue';

</script>

<template>
  <div class="dashboard-grid">
    
    <FocusCard />

    <UrgentPinCard />

    <FutureReminderCard />

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

:deep(.focus-card) {
  grid-column: span 6;
}
:deep(.scratchpad-card) {
  grid-column: span 6;
}
:deep(.tasks-card) {
  grid-column: span 6;
}

/* 確保所有卡片都有最小高度 */
:deep(.focus-card),
:deep(.scratchpad-card),
:deep(.tasks-card),
:deep(.urgent-pin-card), 
:deep(.reminder-card) {
  min-height: 180px;
}
</style>