<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';

const focusText = ref('讀取中...');
const isEditing = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const originalText = ref('');

// --- 1. 讀取資料 ---
// 目的：在元件掛載後，立即透過 IPC 通道從後端資料庫讀取今日首要目標。
onMounted(async () => {
  try {
    const savedMit = await window.ipcRenderer.getMit();
    focusText.value = savedMit || '點此設定今日的首要目標...';
  } catch (error) {
    console.error("Failed to get MIT:", error);
    focusText.value = '讀取資料失敗，請檢查後端連線。';
  }
});

// --- 2. 進入編輯模式 ---
// 目的：當使用者點擊文字時，切換到編輯狀態。
async function startEditing() {
  isEditing.value = true;
  originalText.value = focusText.value; // 保存原始文字，方便取消
  // 使用 nextTick 確保 textarea 已經在 DOM 中渲染出來，然後再對其進行聚焦。
  await nextTick();
  textareaRef.value?.focus();
  textareaRef.value?.select();
}

// --- 3. 儲存變更 ---
// 目的：當使用者完成編輯時，將新內容透過 IPC 通道儲存到資料庫。
async function saveChanges() {
  if (!isEditing.value) return; // 避免 blur 事件在非編輯狀態下觸發儲存
  isEditing.value = false;
  const newText = focusText.value.trim();

  // 如果內容沒有變更，則不執行儲存操作
  if (newText === originalText.value) return; 

  // 如果內容被清空，顯示預設提示文字
  if (!newText) {
    focusText.value = '點此設定今日的首要目標...';
  }
  
  try {
    await window.ipcRenderer.setMit(newText);
    originalText.value = newText; // 儲存成功後，更新原始文字備份
  } catch (error) {
    console.error("Failed to save MIT:", error);
    // 可以在此處加入友善的錯誤提示給使用者
    focusText.value = originalText.value; // 保存失敗，恢復成編輯前的文字
  }
}

// --- 4. 取消編輯 ---
// 目的：當使用者在編輯模式下按下 Esc 鍵時，取消編輯並恢復原始文字。
function cancelEditing() {
  focusText.value = originalText.value;
  isEditing.value = false;
}
</script>

<template>
  <div class="board-note focus-card">
    <h2 class="note-title">📌 今日首要目標 (MIT)</h2>

    <!-- 1. 修改點：整合 .interactive-item 和 .rounded-sm -->
    <p 
      v-if="!isEditing" 
      class="focus-text flex-center interactive-item rounded-sm"
      @click="startEditing"
      title="點擊以編輯"
    >
      {{ focusText }}
    </p>

    <div v-else class="editing-wrapper">
      <textarea
        ref="textareaRef"
        v-model="focusText"
        class="focus-textarea"
        @blur="saveChanges"
        @keydown.enter.prevent="saveChanges"
        @keydown.esc.prevent="cancelEditing"
      ></textarea>
    </div>
  </div>
</template>

<style scoped>
/* --- 樣式從 DashboardHome.vue 遷移並針對互動性進行微調 --- */
.board-note {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  min-height: 180px; /* 與其他卡片保持一致的高度 */
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

.board-note.focus-card {
  border-left: 4px solid var(--color-projects);
}

/* 2. 簡化點：移除已被 .interactive-item 取代的樣式 */
.focus-text {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-primary);
  line-height: 1.6;
  margin: 0;
  flex-grow: 1;
  white-space: pre-wrap;
  word-break: break-word;
}


/* 編輯模式的容器 */
.editing-wrapper {
  flex-grow: 1;
  display: flex;
}

/* 編輯模式的 textarea 樣式 */
.focus-textarea {
  width: 100%;
  flex-grow: 1;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  padding: 0.5rem;
  font-family: inherit;
  font-size: 1.1rem; /* 與顯示模式保持一致 */
  line-height: 1.6; /* 與顯示模式保持一致 */
  resize: none;
}
.focus-textarea:focus {
  outline: none;
  border-color: var(--color-projects);
}
</style>