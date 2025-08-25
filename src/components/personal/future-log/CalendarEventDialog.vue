<script setup lang="ts">
import { ref, watch, computed } from 'vue';

// 在前端檔案中獨立宣告型別
interface CalendarEvent {
  id: number;
  date: string;
  title: string;
  content: string;
  is_urgent_pin: boolean;
  is_future_reminder_pin: boolean;
}
interface PinStatus {
  urgentPinId: number | null;
  futureReminderPinId: number | null;
}

// --- 定義 Props ---
const props = defineProps<{
  modelValue: boolean;
  eventData?: Partial<CalendarEvent>;
  selectedDate?: string;
  pinStatus: PinStatus;
}>();

// --- 定義 Emits ---
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): void;
  (e: 'delete', eventId: number): void;
}>();

// --- 表單狀態 ---
const form = ref({
  title: '',
  content: '',
  is_urgent_pin: false,
  is_future_reminder_pin: false,
});

const titleInputRef = ref<HTMLInputElement | null>(null);

// --- 釘選 Checkbox 的禁用邏輯 ---
const isUrgentPinDisabled = computed(() => {
  return props.pinStatus.urgentPinId !== null && props.eventData?.id !== props.pinStatus.urgentPinId;
});
const isFutureReminderPinDisabled = computed(() => {
  return props.pinStatus.futureReminderPinId !== null && props.eventData?.id !== props.pinStatus.futureReminderPinId;
});

// --- 日期格式化 ---
const formattedDate = computed(() => {
  if (!props.selectedDate) return '';
  const dateParts = props.selectedDate.split('-').map(Number);
  const localDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' } as const;
  return new Intl.DateTimeFormat('zh-TW', options).format(localDate);
});

// 1. 修正：監聽 modelValue 的變化，但只在新增事件時重置表單
watch(() => props.modelValue, (isVisible) => {
  if (isVisible && !props.eventData) {
    form.value = {
      title: '',
      content: '',
      is_urgent_pin: false,
      is_future_reminder_pin: false,
    };
    import('vue').then(({ nextTick }) => {
      nextTick(() => titleInputRef.value?.focus());
    });
  }
});

// 2. 修正：新增對 eventData 的監聽，以確保編輯模式下表單正確初始化
watch(() => props.eventData, (newEventData) => {
  if (newEventData && newEventData.id) {
    form.value = {
      title: newEventData.title || '',
      content: newEventData.content || '',
      is_urgent_pin: newEventData.is_urgent_pin || false,
      is_future_reminder_pin: newEventData.is_future_reminder_pin || false,
    };
    import('vue').then(({ nextTick }) => {
      nextTick(() => titleInputRef.value?.focus());
    });
  }
});

function handleSubmit() {
  if (!form.value.title.trim() || !props.selectedDate) return;

  const eventToSave = {
    date: props.selectedDate,
    ...form.value,
  };
  
  emit('save', eventToSave);
  closeDialog();
}

function handleDelete() {
  if (props.eventData && props.eventData.id) {
    if (window.confirm(`確定要刪除「${props.eventData.title}」這個事件嗎？`)) {
      emit('delete', props.eventData.id);
      closeDialog();
    }
  }
}

function closeDialog() {
  emit('update:modelValue', false);
}
</script>

<template>
  <Transition name="fade">
    <div v-if="props.modelValue" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog-box">
        <h2 class="dialog-title">{{ eventData && eventData.id ? '編輯事件' : '新增事件' }}</h2>
        <p v-if="formattedDate" class="dialog-date">{{ formattedDate }}</p>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="event-title">標題</label>
            <input
              id="event-title"
              ref="titleInputRef"
              type="text"
              v-model="form.title"
              class="dialog-input"
              placeholder="請輸入事件標題..."
              required
            />
          </div>
          <div class="form-group">
            <label for="event-content">內容</label>
            <textarea
              id="event-content"
              v-model="form.content"
              class="dialog-textarea"
              placeholder="請輸入事件詳細內容..."
              rows="4"
            ></textarea>
          </div>
          <div class="form-group-row">
            <label class="checkbox-label" :class="{ 'is-disabled': isUrgentPinDisabled }">
              <input 
                type="checkbox" 
                v-model="form.is_urgent_pin"
                :disabled="isUrgentPinDisabled"
              />
              <span>🔥最急迫事項</span>
            </label>
            <label class="checkbox-label" :class="{ 'is-disabled': isFutureReminderPinDisabled }">
              <input 
                type="checkbox" 
                v-model="form.is_future_reminder_pin"
                :disabled="isFutureReminderPinDisabled"
              />
              <span>🗓️未來提醒</span>
            </label>
          </div>
          
          <div class="dialog-actions">
            <button 
              v-if="eventData && eventData.id"
              type="button" 
              class="btn btn-danger button-reset rounded-sm" 
              @click="handleDelete"
            >
              刪除
            </button>
            <button type="button" class="btn btn-secondary button-reset rounded-sm" @click="closeDialog">取消</button>
            <button type="submit" class="btn btn-primary button-reset rounded-sm">儲存</button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* (大部分樣式保持不變) */
.dialog-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.6); display: flex;
  justify-content: center; align-items: center; z-index: 1000;
}
.dialog-box {
  background-color: var(--bg-secondary); border: 1px solid var(--border-color);
  border-radius: 8px; padding: 1.5rem 2rem; width: 100%; max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}
.dialog-title {
  margin-top: 0; margin-bottom: 0.5rem; font-size: 1.25rem;
  font-weight: 600; color: var(--text-primary);
}
.dialog-date {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.form-group {
  margin-bottom: 1.5rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
}
.dialog-input, .dialog-textarea {
  width: 100%; padding: 0.75rem; font-size: 1rem;
  border: 1px solid var(--border-color); background-color: var(--bg-primary);
  color: var(--text-primary); box-sizing: border-box; border-radius: 4px;
}
.dialog-input:focus, .dialog-textarea:focus {
  outline: none; border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-color-muted);
}
.dialog-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.checkbox-label {
  display: flex; align-items: center; cursor: pointer;
  font-size: 0.9rem; color: var(--text-primary);
  transition: opacity 0.2s;
}
.checkbox-label input {
  margin-right: 0.75rem;
  width: 16px;
  height: 16px;
}
.checkbox-label.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dialog-actions {
  display: flex; justify-content: flex-end; gap: 0.75rem;
  align-items: center;
}
.btn.btn-danger {
  background-color: transparent;
  color: #f87171;
  border: 1px solid #f87171;
  margin-right: auto;
}
.btn.btn-danger:hover {
  background-color: #f87171;
  color: var(--text-accent-contrast);
}

.btn {
  padding: 0.5rem 1.25rem; font-size: 0.9rem; font-weight: 500;
  transition: all 0.2s ease;
}
.btn-primary { background-color: var(--accent-color); color: var(--text-accent-contrast); }
.btn-primary:hover { background-color: var(--accent-color-hover); }
.btn-secondary {
  background-color: var(--bg-tertiary); color: var(--text-primary);
  border: 1px solid var(--border-color);
}
.btn-secondary:hover { background-color: #444; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>