<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
  title: string;
  modelValue: boolean;
  initialValue?: string;
  // --- 1. 新增 Props ---
  showExtensionSelect?: boolean; // 是否顯示副檔名下拉選單
  extensions?: string[];         // 副檔名選項陣列
}>();

const emit = defineEmits([
  'update:modelValue',
  'confirm',
  'cancel'
]);

const inputValue = ref('');
// --- 2. 新增 Ref 來儲存選中的副檔名 ---
const selectedExtension = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

/**
 * 目的：處理確認按鈕的點擊事件。
 */
function handleConfirm() {
  const finalValue = inputValue.value.trim();
  if (!finalValue) {
    inputRef.value?.focus();
    return;
  }

  // --- 3. 組合檔名與副檔名 ---
  // 如果下拉選單可見，則將檔名與選中的副檔名組合
  const result = props.showExtensionSelect 
    ? `${finalValue}${selectedExtension.value}` 
    : finalValue;
  
  emit('confirm', result);
  closeDialog();
}

function handleCancel() {
  emit('cancel');
  closeDialog();
}

function closeDialog() {
  emit('update:modelValue', false);
}

// --- 4. 監聽 modelValue 的變化 ---
// 目的：當對話框打開時，重置內部狀態並聚焦
watch(() => props.modelValue, (isVisible) => {
  if (isVisible) {
    // 重置輸入框的值
    inputValue.value = props.initialValue || '';
    
    // 如果有副檔名選項，預設選中第一個
    if (props.showExtensionSelect && props.extensions && props.extensions.length > 0) {
      selectedExtension.value = props.extensions[0];
    }

    // 使用 nextTick 確保 DOM 更新後再聚焦
    // $nextTick is not available in setup, use nextTick from vue
    import('vue').then(({ nextTick }) => {
      nextTick(() => inputRef.value?.focus());
    });
  }
});

onMounted(() => {
  if (props.modelValue) {
    inputRef.value?.focus();
  }
});
</script>

<template>
  <Transition name="fade">
    <div v-if="props.modelValue" class="dialog-overlay" @click.self="handleCancel">
      <div class="dialog-box" role="dialog" aria-modal="true" :aria-labelledby="title">
        <h2 class="dialog-title" :id="title">{{ props.title }}</h2>
        
        <form @submit.prevent="handleConfirm">
          <div class="input-group">
            <input
              ref="inputRef"
              type="text"
              v-model="inputValue"
              class="dialog-input"
              placeholder="請輸入名稱..."
            />
            <select 
              v-if="showExtensionSelect && extensions" 
              v-model="selectedExtension" 
              class="extension-select"
            >
              <option v-for="ext in extensions" :key="ext" :value="ext">
                {{ ext }}
              </option>
            </select>
          </div>
          
          <div class="dialog-actions">
            <button type="button" class="btn btn-secondary" @click="handleCancel">取消</button>
            <button type="submit" class="btn btn-primary">確認</button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* (dialog-overlay, dialog-box, dialog-title 等樣式保持不變) */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.dialog-box {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}
.dialog-title {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* --- 6. 新增樣式 --- */
.input-group {
  display: flex;
  margin-bottom: 1.5rem;
}
.dialog-input {
  flex-grow: 1;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  box-sizing: border-box;
  /* 為了配合下拉選單，只保留左側圓角 */
  border-radius: 4px 0 0 4px;
}
.dialog-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-color-muted);
  z-index: 1; /* 確保 focus 效果不會被蓋住 */
}
.extension-select {
  flex-shrink: 0;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid var(--border-color);
  border-left: none;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border-radius: 0 4px 4px 0;
}
.extension-select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-color-muted);
}
/* 當沒有下拉選單時，讓輸入框恢復圓角 */
.input-group .dialog-input:only-child {
  border-radius: 4px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
.btn {
  padding: 0.5rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-primary {
  background-color: var(--accent-color);
  color: var(--text-accent-contrast);
}
.btn-primary:hover {
  background-color: var(--accent-color-hover);
}
.btn-secondary {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}
.btn-secondary:hover {
  background-color: #444;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>