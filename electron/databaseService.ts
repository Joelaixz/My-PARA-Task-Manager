// 檔案位置: electron/databaseService.ts
import type { Knex } from 'knex';

// 目的：為 kv_storage 表格的每一筆紀錄定義一個 TypeScript 型別，增強程式碼的型別安全性。
interface KvStorage {
  key: string;
  value: string;
}

/**
 * 目的：從 kv_storage 表格中取得指定 key 的值。
 * @param db - 從 main.ts 傳入的 Knex 資料庫實例。
 * @param key - 要查詢的鍵，例如 'mit' (今日首要目標)。
 * @returns {Promise<string | null>} - 回傳找到的文字內容，如果找不到則回傳 null。
 */
async function getValue(db: Knex, key: string): Promise<string | null> {
  const result = await db<KvStorage>('kv_storage').where('key', key).first();
  return result ? result.value : null;
}

/**
 * 目的：在 kv_storage 表格中設定指定 key 的值 (Upsert)。
 * @param db - Knex 資料庫實例。
 * @param key - 要設定的鍵。
 * @param value - 要設定的值。
 * @returns {Promise<void>}
 */
async function setValue(db: Knex, key: string, value: string): Promise<void> {
  await db<KvStorage>('kv_storage')
    .insert({ key, value })
    .onConflict('key')
    .merge();
}

// 目的：將所有資料庫操作函式包裝成一個 'databaseService' 物件並匯出。
export const databaseService = {
  getValue,
  setValue,
};