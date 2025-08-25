<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import CalendarHeader from './future-log/CalendarHeader.vue';
import CalendarGrid from './future-log/CalendarGrid.vue';
import CalendarEventDialog from './future-log/CalendarEventDialog.vue';

// 在前端檔案中獨立宣告型別
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
// 1. 修正：更新 PinStatus 介面，以符合後端的新模型
interface PinStatus {
  urgentPinId: number | null;
  futureReminderPinId: number | null;
}

// --- 狀態定義 ---
const today = new Date();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth()); // 0-11
const events = ref<CalendarEvent[]>([]);
const isDialogOpen = ref(false);
const editingEvent = ref<Partial<CalendarEvent> | undefined>(undefined);
const selectedDate = ref<string | undefined>(undefined);
// 2. 修正：儲存新的釘選狀態模型
const globalPinStatus = ref<PinStatus>({
  urgentPinId: null,
  futureReminderPinId: null,
});

// --- 資料獲取與管理 ---
async function fetchEvents() {
  try {
    // 3. 修改：獲取當月事件和新的釘選狀態
    [events.value, globalPinStatus.value] = await Promise.all([
      window.ipcRenderer.getCalendarEventsByMonth(currentYear.value, currentMonth.value),
      window.ipcRenderer.getGlobalPinStatus()
    ]);
  } catch (error) {
    console.error("Failed to fetch calendar data:", error);
    events.value = [];
  }
}

// --- 事件對話框處理 ---
function handleOpenAddDialog(date: string) {
  selectedDate.value = date;
  editingEvent.value = undefined;
  isDialogOpen.value = true;
}

function handleOpenEditDialog(event: CalendarEvent) {
  selectedDate.value = event.date;
  editingEvent.value = { ...event };
  isDialogOpen.value = true;
}

async function handleSave(eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) {
  try {
    if (editingEvent.value && editingEvent.value.id) {
      await window.ipcRenderer.updateCalendarEvent(editingEvent.value.id, eventData);
    } else {
      await window.ipcRenderer.addCalendarEvent(eventData);
    }
    // 4. 修改：儲存後，重新獲取所有資料以確保狀態同步
    await fetchEvents();
  } catch (error) {
    console.error("Failed to save calendar event:", error);
  } finally {
    isDialogOpen.value = false;
  }
}

// 5. 新增：處理刪除事件的函式
async function handleDelete(eventId: number) {
  try {
    await window.ipcRenderer.deleteCalendarEvent(eventId);
    await fetchEvents();
  } catch (error) {
    console.error("Failed to delete calendar event:", error);
  }
}

// --- 日曆導航與生命週期 ---
onMounted(fetchEvents);
watch([currentYear, currentMonth], fetchEvents);

function handleMonthChange(date: { year: number, month: number }) {
  currentYear.value = date.year;
  currentMonth.value = date.month;
}
</script>

<template>
  <div class="future-log-container">
    <div class="page-actions">
      </div>
    <div class="calendar-wrapper">
      <CalendarHeader @update-month-year="handleMonthChange" />
      <CalendarGrid 
        :year="currentYear" 
        :month="currentMonth" 
        :events="events"
        @add-event="handleOpenAddDialog"
        @edit-event="handleOpenEditDialog"
      />
    </div>
  </div>
  
  <CalendarEventDialog 
    v-model="isDialogOpen"
    :selected-date="selectedDate"
    :event-data="editingEvent"
    :pin-status="globalPinStatus" 
    @save="handleSave"
    @delete="handleDelete"
  />
</template>

<style scoped>
.future-log-container {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.page-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  gap: 0.75rem;
}

.calendar-wrapper {
  flex-grow: 1;
  padding: 1.5rem;
  overflow-y: auto;
}
</style>