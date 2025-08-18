// 檔案位置: electron/databaseService.ts
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

interface TaskList {
  id: number;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}


// --- Key-Value 儲存相關 ---

/**
 * 目的：根據指定的 key 從 kv_storage 表中讀取一個值。
 * 註解：這是通用的讀取函式，我們將在此基礎上封裝特定功能的函式。
 */
async function getValue(db: Knex, key: string): Promise<string | null> {
  const result = await db<KvStorage>('kv_storage').where('key', key).first();
  return result ? result.value : null;
}

/**
 * 目的：在 kv_storage 表中寫入或更新一個鍵值對。
 * 註解：這是通用的寫入函式，使用 .onConflict().merge() 來處理新增或更新的邏輯。
 */
async function setValue(db: Knex, key: string, value: string): Promise<void> {
  await db<KvStorage>('kv_storage')
    .insert({ key, value })
    .onConflict('key')
    .merge();
}

// --- 1. 新增：取得指定模式的最後開啟路徑 ---
/**
 * 目的：根據 PARA 模式（如 'personal', 'projects'）獲取最後一次開啟的資料夾路徑。
 * @param db - Knex 資料庫實例。
 * @param mode - 側邊欄模式的字串表示。
 * @returns {Promise<string | null>} - 儲存的路徑，如果不存在則為 null。
 */
async function getLastPathForMode(db: Knex, mode: string): Promise<string | null> {
  // 為什麼：我們透過組合 'last_path_' 前綴和模式名稱來建立一個唯一的 key，
  //         然後呼叫通用的 getValue 函式來實現，這符合 DRY 原則。
  const key = `last_path_${mode}`;
  return getValue(db, key);
}

// --- 2. 新增：設定指定模式的最後開啟路徑 ---
/**
 * 目的：為指定的 PARA 模式設定並儲存最後一次開啟的資料夾路徑。
 * @param db - Knex 資料庫實例。
 * @param mode - 側邊欄模式的字串表示。
 * @param path - 要儲存的資料夾路徑。
 * @returns {Promise<void>}
 */
async function setLastPathForMode(db: Knex, mode: string, path: string): Promise<void> {
  // 為什麼：與讀取函式類似，我們組合出唯一的 key，並呼叫通用的 setValue 函式。
  const key = `last_path_${mode}`;
  return setValue(db, key, path);
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


// --- 任務清單 (Task Lists) CRUD 操作 (保持不變) ---
async function getTaskLists(db: Knex): Promise<TaskList[]> {
  return db<TaskList>('task_lists').orderBy('name', 'asc');
}

async function getTaskList(db: Knex, id: number): Promise<TaskList | null> {
  const taskList = await db<TaskList>('task_lists').where('id', id).first();
  return taskList || null;
}

async function createTaskList(db: Knex, name: string): Promise<TaskList> {
  const [newTaskList] = await db<TaskList>('task_lists')
    .insert({ name })
    .returning('*');
  return newTaskList;
}

async function updateTaskListContent(db: Knex, id: number, content: string): Promise<TaskList | null> {
  const [updatedTaskList] = await db<TaskList>('task_lists')
    .where('id', id)
    .update({ content, updated_at: db.fn.now() }) 
    .returning('*');
  return updatedTaskList || null;
}

async function deleteTaskList(db: Knex, id: number): Promise<boolean> {
  const deletedRows = await db<TaskList>('task_lists').where('id', id).del();
  return deletedRows > 0;
}


// --- 3. 將所有函式匯出 ---
export const databaseService = {
  // Key-Value
  getValue,
  setValue,
  // --- 新增匯出 ---
  getLastPathForMode,
  setLastPathForMode,
  // MIT
  getMit: (db: Knex) => getValue(db, 'mit'),
  setMit: (db: Knex, content: string) => setValue(db, 'mit', content),
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