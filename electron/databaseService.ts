import type { Knex } from 'knex';

// --- 型別定義 ---
interface KvStorage {
  key: string;
  value: string;
}

interface ScratchpadNote {
  id: number;
  content: string;
  created_at: string;
}

// 1. 新增：為 task_lists 表格的紀錄定義 TypeScript 型別
interface TaskList {
  id: number;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}


// --- Key-Value 儲存相關 (保持不變) ---
async function getValue(db: Knex, key: string): Promise<string | null> {
  const result = await db<KvStorage>('kv_storage').where('key', key).first();
  return result ? result.value : null;
}

async function setValue(db: Knex, key: string, value: string): Promise<void> {
  await db<KvStorage>('kv_storage')
    .insert({ key, value })
    .onConflict('key')
    .merge();
}


// --- 隨手筆記 (Scratchpad Notes) CRUD 操作 (保持不變) ---
async function getAllScratchpadNotes(db: Knex): Promise<ScratchpadNote[]> {
  return db<ScratchpadNote>('scratchpad_notes').orderBy('created_at', 'asc');
}

async function addScratchpadNote(db: Knex, content: string): Promise<ScratchpadNote> {
  const [newNote] = await db<ScratchpadNote>('scratchpad_notes')
    .insert({ content })
    .returning('*');
  return newNote;
}

async function updateScratchpadNote(db: Knex, id: number, content: string): Promise<ScratchpadNote | null> {
  const [updatedNote] = await db<ScratchpadNote>('scratchpad_notes')
    .where('id', id)
    .update({ content })
    .returning('*');
  return updatedNote || null;
}

async function deleteScratchpadNote(db: Knex, id: number): Promise<boolean> {
  const deletedRows = await db<ScratchpadNote>('scratchpad_notes')
    .where('id', id)
    .del();
  return deletedRows > 0;
}


// --- 2. 新增：任務清單 (Task Lists) CRUD 操作 ---

/**
 * 目的：取得所有任務清單，按名稱排序。
 */
async function getTaskLists(db: Knex): Promise<TaskList[]> {
  return db<TaskList>('task_lists').orderBy('name', 'asc');
}

/**
 * 目的：根據 ID 取得單一任務清單的詳細資訊。
 */
async function getTaskList(db: Knex, id: number): Promise<TaskList | null> {
  const taskList = await db<TaskList>('task_lists').where('id', id).first();
  return taskList || null;
}

/**
 * 目的：建立一個新的任務清單。
 */
async function createTaskList(db: Knex, name: string): Promise<TaskList> {
  const [newTaskList] = await db<TaskList>('task_lists')
    .insert({ name })
    .returning('*');
  return newTaskList;
}

/**
 * 目的：更新指定任務清單的 Markdown 內容。
 */
async function updateTaskListContent(db: Knex, id: number, content: string): Promise<TaskList | null> {
  const [updatedTaskList] = await db<TaskList>('task_lists')
    .where('id', id)
    .update({ content, updated_at: db.fn.now() }) // 同時更新 'updated_at' 時間戳
    .returning('*');
  return updatedTaskList || null;
}

/**
 * 目的：刪除一個任務清單。
 */
async function deleteTaskList(db: Knex, id: number): Promise<boolean> {
  const deletedRows = await db<TaskList>('task_lists').where('id', id).del();
  return deletedRows > 0;
}


// --- 3. 將所有函式匯出 ---
export const databaseService = {
  // Key-Value
  getValue,
  setValue,
  // Scratchpad
  getAllScratchpadNotes,
  addScratchpadNote,
  updateScratchpadNote,
  deleteScratchpadNote,
  // Task Lists
  getTaskLists,
  getTaskList,
  createTaskList,
  updateTaskListContent,
  deleteTaskList,
};