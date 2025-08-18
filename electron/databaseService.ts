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

// --- 1. 修改點：在 TaskList 型別中加入 display_order ---
// 目的：讓 TypeScript 知道 task_lists 表的紀錄現在包含這個新欄位。
interface TaskList {
  id: number;
  name: string;
  content: string;
  display_order: number; // 新增
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


// --- 隨手筆記 (Scratchpad Notes) CRUD 操作 (保持不變) ---
async function getAllScratchpadNotes(db: Knex): Promise<ScratchpadNote[]> { /* ... */ return db<ScratchpadNote>('scratchpad_notes').orderBy('created_at', 'asc'); }
async function addScratchpadNote(db: Knex, content: string): Promise<ScratchpadNote> { /* ... */ const [newNote] = await db<ScratchpadNote>('scratchpad_notes').insert({ content }).returning('*'); return newNote; }
async function updateScratchpadNote(db: Knex, id: number, content: string): Promise<ScratchpadNote | null> { /* ... */ const [updatedNote] = await db<ScratchpadNote>('scratchpad_notes').where('id', id).update({ content }).returning('*'); return updatedNote || null; }
async function deleteScratchpadNote(db: Knex, id: number): Promise<boolean> { /* ... */ const deletedRows = await db<ScratchpadNote>('scratchpad_notes').where('id', id).del(); return deletedRows > 0; }


// --- 任務清單 (Task Lists) CRUD 操作 ---

/**
 * 目的：取得所有任務清單，並根據 display_order 排序。
 */
async function getTaskLists(db: Knex): Promise<TaskList[]> {
  // --- 2. 修改點：將 orderBy 從 'name' 改為 'display_order' ---
  // 為什麼：這是實現自訂排序的核心，確保前端從資料庫拿到的永遠是正確的順序。
  return db<TaskList>('task_lists').orderBy('display_order', 'asc');
}

async function getTaskList(db: Knex, id: number): Promise<TaskList | null> {
  const taskList = await db<TaskList>('task_lists').where('id', id).first();
  return taskList || null;
}

/**
 * 目的：建立一個新的任務清單，並自動將其排在最後。
 */
async function createTaskList(db: Knex, name: string): Promise<TaskList> {
  // --- 3. 修改點：在建立時自動設定 display_order ---
  // 為什麼：需要確保新建立的列表有初始的排序值，且排在現有列表的最後。
  // 步驟：
  //   1. 使用 transaction 確保兩次資料庫操作的原子性。
  //   2. 查詢目前最大的 display_order 值。
  //   3. 將新列表的 display_order 設為最大值 + 1。
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

/**
 * 目的：更新指定任務清單的 Markdown 內容。
 */
async function updateTaskListContent(db: Knex, id: number, content: string): Promise<TaskList | null> {
  const [updatedTaskList] = await db<TaskList>('task_lists')
    .where('id', id)
    .update({ content, updated_at: db.fn.now() })
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

// --- 4. 新增點：建立一個專門用來更新排序的函式 ---
/**
 * 目的：根據前端傳來的 ID 陣列，一次性更新所有任務清單的排序。
 * @param db - Knex 資料庫實例。
 * @param orderedIds - 包含任務清單 ID 的陣列，其順序即為新的顯示順序。
 * @returns {Promise<boolean>} - 是否更新成功。
 */
async function updateTaskListsOrder(db: Knex, orderedIds: number[]): Promise<boolean> {
  try {
    // 為什麼：使用 transaction 可以確保所有更新要麼全部成功，要麼全部失敗，
    //         避免了中途出錯導致資料庫排序混亂的問題。
    await db.transaction(async (trx) => {
      // 為什麼：使用 Promise.all 可以並行執行所有的更新操作，比一個一個 await 更有效率。
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
  // --- 新增匯出 ---
  updateTaskListsOrder,
};