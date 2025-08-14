<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';

// 從 'electron-env.d.ts' 來的型別，確保前後端資料結構一致
interface ScratchpadNote {
  id: number;
  content: string;
  created_at: string;
}

const notes = ref<ScratchpadNote[]>([]);
const newNoteContent = ref('');
const editingNoteId = ref<number | null>(null);
const editingText = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

// --- 讀取所有筆記 ---
onMounted(async () => {
  try {
    notes.value = await window.ipcRenderer.getScratchpadNotes();
  } catch (error) {
    console.error("Failed to fetch scratchpad notes:", error);
  }
});

// --- 新增筆記 ---
async function addNote() {
  const content = newNoteContent.value.trim();
  if (!content) return;

  try {
    const newNote = await window.ipcRenderer.addScratchpadNote(content);
    // --- 修改點：將 unshift 改為 push ---
    // 目的：將新建立的筆記添加到列表的末尾，而不是開頭。
    notes.value.push(newNote);
    newNoteContent.value = ''; // 清空輸入框
  } catch (error) {
    console.error("Failed to add scratchpad note:", error);
  }
}

// --- 刪除筆記 ---
async function deleteNote(id: number) {
  try {
    const success = await window.ipcRenderer.deleteScratchpadNote(id);
    if (success) {
      notes.value = notes.value.filter(note => note.id !== id);
    }
  } catch (error) {
    console.error("Failed to delete scratchpad note:", error);
  }
}

// --- 進入編輯模式 ---
async function startEditing(note: ScratchpadNote) {
  editingNoteId.value = note.id;
  editingText.value = note.content;
  await nextTick();
  inputRef.value?.focus();
}

// --- 儲存編輯 ---
async function saveEdit(note: ScratchpadNote) {
  const newContent = editingText.value.trim();
  if (!newContent || newContent === note.content) {
    cancelEdit();
    return;
  }

  try {
    const updatedNote = await window.ipcRenderer.updateScratchpadNote(note.id, newContent);
    if (updatedNote) {
      note.content = updatedNote.content;
    }
  } catch (error) {
    console.error("Failed to update scratchpad note:", error);
  } finally {
    cancelEdit();
  }
}

// --- 取消編輯 ---
function cancelEdit() {
  editingNoteId.value = null;
  editingText.value = '';
}
</script>

<template>
  <div class="board-note scratchpad-card">
    <h2 class="note-title">✍️ 隨手筆記</h2>

    <div class="notes-list">
      <div v-for="note in notes" :key="note.id" class="note-item">
        <div v-if="editingNoteId !== note.id" class="note-content" @dblclick="startEditing(note)">
          <p>{{ note.content }}</p>
          <button @click="deleteNote(note.id)" class="delete-btn" title="刪除筆記">×</button>
        </div>
        <input
          v-else
          ref="inputRef"
          v-model="editingText"
          type="text"
          class="edit-input"
          @blur="saveEdit(note)"
          @keydown.enter.prevent="saveEdit(note)"
          @keydown.esc.prevent="cancelEdit"
        />
      </div>
    </div>

    <div class="add-note-area">
      <input
        v-model="newNoteContent"
        type="text"
        placeholder="新增一筆筆記..."
        class="add-input"
        @keydown.enter.prevent="addNote"
      />
    </div>
  </div>
</template>

<style scoped>
.scratchpad-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  border-left: 4px solid var(--color-archives);
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

.notes-list {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.note-item {
  padding: 6px 0;
  font-size: 0.9rem;
}

.note-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.note-content:hover {
  background-color: var(--bg-tertiary);
}
.note-content p {
  margin: 0;
  flex-grow: 1;
  word-break: break-word;
}
.delete-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
  padding: 0 8px;
}
.note-content:hover .delete-btn {
  opacity: 1;
}
.delete-btn:hover {
  color: #f87171;
}

.edit-input,
.add-input {
  width: 100%;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  padding: 0.5rem 0.75rem;
  font-family: inherit;
  font-size: 0.9rem;
  box-sizing: border-box;
}
.edit-input:focus,
.add-input:focus {
  outline: none;
  border-color: var(--color-archives);
}

.add-note-area {
  flex-shrink: 0;
  padding-top: 0.5rem;
}
</style>