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

// --- 隨手筆記 (Scratchpad Notes) CRUD 操作 ---

/**
 * 目的：取得所有隨手筆記，並依照建立時間由舊到新排序。
 * @param db - Knex 資料庫實例。
 * @returns {Promise<ScratchpadNote[]>} - 回傳筆記物件的陣列。
 */
async function getAllScratchpadNotes(db: Knex): Promise<ScratchpadNote[]> {
  // --- 修改點：將 'desc' 改為 'asc' ---
  return db<ScratchpadNote>('scratchpad_notes').orderBy('created_at', 'asc');
}

/**
 * 目的：新增一筆隨手筆記。
 * @param db - Knex 資料庫實例。
 * @param content - 新筆記的文字內容。
 * @returns {Promise<ScratchpadNote>} - 回傳剛建立完成的筆記物件。
 */
async function addScratchpadNote(db: Knex, content: string): Promise<ScratchpadNote> {
  const [newNote] = await db<ScratchpadNote>('scratchpad_notes')
    .insert({ content })
    .returning('*');
  return newNote;
}

/**
 * 目的：更新一筆既有的隨手筆記。
 * @param db - Knex 資料庫實例。
 * @param id - 要更新的筆記 ID。
 * @param content - 新的文字內容。
 * @returns {Promise<ScratchpadNote | null>} - 回傳更新後的筆記物件，如果找不到則回傳 null。
 */
async function updateScratchpadNote(db: Knex, id: number, content: string): Promise<ScratchpadNote | null> {
  const [updatedNote] = await db<ScratchpadNote>('scratchpad_notes')
    .where('id', id)
    .update({ content })
    .returning('*');
  return updatedNote || null;
}

/**
 * 目的：刪除一筆隨手筆記。
 * @param db - Knex 資料庫實例。
 * @param id - 要刪除的筆記 ID。
 * @returns {Promise<boolean>} - 回傳是否刪除成功。
 */
async function deleteScratchpadNote(db: Knex, id: number): Promise<boolean> {
  const deletedRows = await db<ScratchpadNote>('scratchpad_notes')
    .where('id', id)
    .del();
  return deletedRows > 0;
}


// --- 將所有函式匯出 ---
export const databaseService = {
  // Key-Value
  getValue,
  setValue,
  // Scratchpad
  getAllScratchpadNotes,
  addScratchpadNote,
  updateScratchpadNote,
  deleteScratchpadNote,
};