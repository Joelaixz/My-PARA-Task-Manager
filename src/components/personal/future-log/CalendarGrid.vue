<script setup lang="ts">
import { computed } from 'vue';

// 在前端檔案中獨立宣告 CalendarEvent 型別
interface CalendarEvent {
  id: number;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  is_urgent_pin: boolean;
  is_future_reminder_pin: boolean;
  created_at: string;
  updated_at: string;
}

// --- 定義 Props ---
const props = defineProps<{
  year: number;
  month: number; // 0-11
  events: CalendarEvent[];
}>();

// --- 定義 Emits ---
const emit = defineEmits<{
  (e: 'add-event', date: string): void;
  (e: 'edit-event', event: CalendarEvent): void;
}>();

// --- 包裝 emit 呼叫的本地函式 ---
function handleAddEvent(date: string) {
  emit('add-event', date);
}

function handleEditEvent(event: CalendarEvent) {
  emit('edit-event', event);
}


// --- 建立一個描述單一日期格子的型別 ---
interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayNumber: number;
  events: CalendarEvent[];
}

// --- 核心邏輯：動態計算日曆陣列 ---
const calendarDays = computed<CalendarDay[]>(() => {
  const days: CalendarDay[] = [];
  const date = new Date(props.year, props.month, 1);
  const today = new Date();

  const firstDayOfWeek = date.getDay();
  const daysInMonth = new Date(props.year, props.month + 1, 0).getDate();
  const daysInLastMonth = new Date(props.year, props.month, 0).getDate();

  const getEventsForDate = (dayDate: Date) => {
    // 1. 修正：直接比較 YYYY-MM-DD 字串，避免時區問題
    const dateString = toYYYYMMDD(dayDate);
    return props.events.filter(event => event.date === dateString);
  };

  // 2. 修正：建立一個可靠的函式來將 Date 物件轉為 'YYYY-MM-DD' 格式
  const toYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // A. 填充上個月的日期
  for (let i = firstDayOfWeek; i > 0; i--) {
    const day = daysInLastMonth - i + 1;
    const dayDate = new Date(props.year, props.month - 1, day);
    days.push({
      date: dayDate,
      isCurrentMonth: false,
      isToday: false,
      dayNumber: day,
      events: getEventsForDate(dayDate),
    });
  }

  // B. 填充本月的日期
  for (let i = 1; i <= daysInMonth; i++) {
    const currentDate = new Date(props.year, props.month, i);
    days.push({
      date: currentDate,
      isCurrentMonth: true,
      isToday: toYYYYMMDD(currentDate) === toYYYYMMDD(today),
      dayNumber: i,
      events: getEventsForDate(currentDate),
    });
  }

  // C. 填充下個月的日期
  const remainingSlots = 42 - days.length;
  for (let i = 1; i <= remainingSlots; i++) {
    const dayDate = new Date(props.year, props.month + 1, i);
    days.push({
      date: dayDate,
      isCurrentMonth: false,
      isToday: false,
      dayNumber: i,
      events: getEventsForDate(dayDate),
    });
  }
  
  return days;
});

// 3. 修正：建立一個輔助函式，確保傳遞給父元件的是正確的 YYYY-MM-DD 字串
function getEventDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
</script>

<template>
  <div class="calendar-grid-container">
    <div class="weekday-header">日</div>
    <div class="weekday-header">一</div>
    <div class="weekday-header">二</div>
    <div class="weekday-header">三</div>
    <div class="weekday-header">四</div>
    <div class="weekday-header">五</div>
    <div class="weekday-header">六</div>

    <div 
      class="day-cell" 
      v-for="(day, index) in calendarDays" 
      :key="index"
      :class="{
        'not-current-month': !day.isCurrentMonth,
        'is-today': day.isToday
      }"
      @click="handleAddEvent(getEventDateString(day.date))"
    >
      <span class="day-number">{{ day.dayNumber }}</span>
      <div class="event-list">
        <div 
          v-for="event in day.events" 
          :key="event.id" 
          class="event-item" 
          :class="{
            'is-urgent-pin': event.is_urgent_pin,
            'is-future-reminder-pin': event.is_future_reminder_pin
          }"
          :title="event.title"
          @click.stop="handleEditEvent(event)"
        >
          {{ event.title }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-grid-container {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}

.weekday-header {
  text-align: center;
  color: var(--text-secondary);
  font-size: 1rem;
  padding: 0.6rem;
  background-color: var(--bg-tertiary);
  font-weight: bold; 
  border-radius: 4px;
}

.day-cell {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.5rem;
  min-height: 100px;
  position: relative;
  transition: background-color 0.2s;
  overflow-y: auto;
  cursor: pointer;
}
.day-cell:hover {
  background-color: var(--bg-tertiary);
}

.day-number {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.not-current-month .day-number {
  opacity: 0.3;
}
.is-today {
  background-color: var(--accent-color-muted);
  border-color: var(--accent-color);
}
.is-today .day-number {
  color: var(--text-accent-contrast);
  background-color: var(--accent-color);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 2rem;
}

.event-item {
  /* 1. 修正：將未釘選事件的預設背景色設定為 --color-archives-muted */
  background-color: var(--color-archives-muted);
  color: var(--text-primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: background-color 0.2s;
}
.event-item:hover {
  /* 2. 修正：將未釘選事件的 hover 背景色設定為 --color-archives */
  background-color: var(--color-archives);
  color: var(--text-primary);
}

/* --- 3. 新增：為不同釘選類型的事件添加獨特的視覺樣式 --- */
.event-item.is-urgent-pin {
  background-color: var(--color-personal-muted);
}
.event-item.is-urgent-pin:hover {
  background-color: var(--color-personal);
}

.event-item.is-future-reminder-pin {
  background-color: var(--color-areas-muted);
}
.event-item.is-future-reminder-pin:hover {
  background-color: var(--color-areas);
}
</style>