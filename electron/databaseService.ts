// 檔案位置: electron/databaseService.ts
import type { Knex } from 'knex';

// --- (其他型別定義保持不變) ---
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
  display_order: number;
  created_at: string;
  updated_at: string;
}

// --- Key-Value 儲存相關 ---
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
async function getLastPathForMode(db: Knex, mode: string): Promise<string | null> {
  const key = `last_path_${mode}`;
  return getValue(db, key);
}
async function setLastPathForMode(db: Knex, mode: string, path: string): Promise<void> {
  const key = `last_path_${mode}`;
  return setValue(db, key, path);
}

// --- (隨手筆記 CRUD 操作保持不變) ---
async function getAllScratchpadNotes(db: Knex): Promise<ScratchpadNote[]> { return db<ScratchpadNote>('scratchpad_notes').orderBy('created_at', 'asc'); }
async function addScratchpadNote(db: Knex, content: string): Promise<ScratchpadNote> { const [newNote] = await db<ScratchpadNote>('scratchpad_notes').insert({ content }).returning('*'); return newNote; }
async function updateScratchpadNote(db: Knex, id: number, content: string): Promise<ScratchpadNote | null> { const [updatedNote] = await db<ScratchpadNote>('scratchpad_notes').where('id', id).update({ content }).returning('*'); return updatedNote || null; }
async function deleteScratchpadNote(db: Knex, id: number): Promise<boolean> { const deletedRows = await db<ScratchpadNote>('scratchpad_notes').where('id', id).del(); return deletedRows > 0; }

// --- (任務清單 CRUD 操作保持不變) ---
async function getTaskLists(db: Knex): Promise<TaskList[]> {
  return db<TaskList>('task_lists').orderBy('display_order', 'asc');
}
async function getTaskList(db: Knex, id: number): Promise<TaskList | null> {
  const taskList = await db<TaskList>('task_lists').where('id', id).first();
  return taskList || null;
}
async function createTaskList(db: Knex, name: string): Promise<TaskList> {
  return db.transaction(async (trx) => {
    const maxOrderResult = await trx('task_lists').max('display_order as maxOrder').first();
    const maxOrder = maxOrderResult?.maxOrder || 0;
    const [newTaskList] = await trx<TaskList>('task_lists')
      .insert({ 
        name,
        display_order: maxOrder + 1 
      })
      .returning('*');
    return newTaskList;
  });
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
async function updateTaskListsOrder(db: Knex, orderedIds: number[]): Promise<boolean> {
  try {
    await db.transaction(async (trx) => {
      await Promise.all(
        orderedIds.map((id, index) => {
          return trx('task_lists')
            .where('id', id)
            .update({ display_order: index });
        })
      );
    });
    return true;
  } catch (error) {
    console.error("Failed to update task lists order:", error);
    return false;
  }
}

// --- 5. 將所有函式匯出 ---
export const databaseService = {
  // Key-Value
  getValue,
  setValue,
  getLastPathForMode,
  setLastPathForMode,
  // MIT
  getMit: (db: Knex) => getValue(db, 'mit'),
  setMit: (db: Knex, content: string) => setValue(db, 'mit', content),
  // --- 1. 新增點：建立讀取與儲存主題的函式 ---
  // 目的：提供給 main.ts 呼叫的專用函式，用來操作資料庫中的主題設定。
  getTheme: (db: Knex) => getValue(db, 'theme'),
  setTheme: (db: Knex, theme: string) => setValue(db, 'theme', theme),
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
  updateTaskListsOrder,
};