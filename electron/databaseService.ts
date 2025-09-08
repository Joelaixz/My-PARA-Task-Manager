// 檔案位置: electron/databaseService.ts
import type { Knex } from 'knex';

// --- (其他型別定義與函式保持不變) ---
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
interface CalendarEvent {
  id: number;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  is_urgent_pin: boolean;
  is_future_reminder_pin: boolean;
  created_at: string;
  updated_at: string;
}
interface PinStatus {
  urgentPinId: number | null;
  futureReminderPinId: number | null;
}
interface PinnedCalendarEvents {
  urgentEvent: CalendarEvent | null;
  futureEvent: CalendarEvent | null;
}


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

// --- 1. 新增：讀取/寫入各模式最後開啟檔案的函式 ---
/**
 * 目的：根據模式名稱，從資料庫讀取最後開啟的檔案路徑。
 * @param db - Knex 資料庫實例。
 * @param mode - 模式名稱 (例如 'personal', 'projects')。
 * @returns {Promise<string | null>} - 檔案路徑或 null。
 */
async function getLastFileForMode(db: Knex, mode: string): Promise<string | null> {
  const key = `last_file_${mode}`;
  return getValue(db, key);
}

/**
 * 目的：將指定模式的最後開啟檔案路徑寫入資料庫。
 * @param db - Knex 資料庫實例。
 * @param mode - 模式名稱。
 * @param path - 要儲存的完整檔案路徑。
 */
async function setLastFileForMode(db: Knex, mode: string, path: string): Promise<void> {
  const key = `last_file_${mode}`;
  return setValue(db, key, path);
}


async function getAllScratchpadNotes(db: Knex): Promise<ScratchpadNote[]> { return db<ScratchpadNote>('scratchpad_notes').orderBy('created_at', 'asc'); }
async function addScratchpadNote(db: Knex, content: string): Promise<ScratchpadNote> { const [newNote] = await db<ScratchpadNote>('scratchpad_notes').insert({ content }).returning('*'); return newNote; }
async function updateScratchpadNote(db: Knex, id: number, content: string): Promise<ScratchpadNote | null> { const [updatedNote] = await db<ScratchpadNote>('scratchpad_notes').where('id', id).update({ content }).returning('*'); return updatedNote || null; }
async function deleteScratchpadNote(db: Knex, id: number): Promise<boolean> { const deletedRows = await db<ScratchpadNote>('scratchpad_notes').where('id', id).del(); return deletedRows > 0; }
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
async function getCalendarEventsByMonth(db: Knex, year: number, month: number): Promise<CalendarEvent[]> {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = new Date(year, month + 1, 1).toISOString().split('T')[0];
  return db<CalendarEvent>('calendar_events')
    .where('date', '>=', startDate)
    .andWhere('date', '<', endDate)
    .orderBy('date', 'asc');
}

async function addCalendarEvent(db: Knex, event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent> {
  const [newEvent] = await db<CalendarEvent>('calendar_events').insert(event).returning('*');
  return newEvent;
}

async function updateCalendarEvent(db: Knex, id: number, updates: Partial<Omit<CalendarEvent, 'id' | 'created_at'>>): Promise<CalendarEvent | null> {
  const [updatedEvent] = await db<CalendarEvent>('calendar_events')
    .where('id', id)
    .update({ ...updates, updated_at: db.fn.now() })
    .returning('*');
  return updatedEvent || null;
}
async function deleteCalendarEvent(db: Knex, id: number): Promise<boolean> {
  const deletedRows = await db<CalendarEvent>('calendar_events').where('id', id).del();
  return deletedRows > 0;
}
async function getGlobalPinStatus(db: Knex): Promise<PinStatus> {
  const urgentPin = await db<CalendarEvent>('calendar_events').where('is_urgent_pin', true).select('id').first();
  const futureReminderPin = await db<CalendarEvent>('calendar_events').where('is_future_reminder_pin', true).select('id').first();
  return {
    urgentPinId: urgentPin?.id || null,
    futureReminderPinId: futureReminderPin?.id || null,
  };
}
async function getPinnedCalendarEvents(db: Knex): Promise<PinnedCalendarEvents> {
  const urgentEvent = await db<CalendarEvent>('calendar_events').where('is_urgent_pin', true).first();
  const futureEvent = await db<CalendarEvent>('calendar_events').where('is_future_reminder_pin', true).first();
  return {
    urgentEvent: urgentEvent || null,
    futureEvent: futureEvent || null,
  };
}


export const databaseService = {
  getValue,
  setValue,
  getLastPathForMode,
  setLastPathForMode,
  // --- 2. 新增：將新函式加入匯出物件 ---
  getLastFileForMode,
  setLastFileForMode,
  getMit: (db: Knex) => getValue(db, 'mit'),
  setMit: (db: Knex, content: string) => setValue(db, 'mit', content),
  getTheme: (db: Knex) => getValue(db, 'theme'),
  setTheme: (db: Knex, theme: string) => setValue(db, 'theme', theme),
  getAllScratchpadNotes,
  addScratchpadNote,
  updateScratchpadNote,
  deleteScratchpadNote,
  getTaskLists,
  getTaskList,
  createTaskList,
  updateTaskListContent,
  deleteTaskList,
  updateTaskListsOrder,
  getCalendarEventsByMonth,
  addCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getGlobalPinStatus,
  getPinnedCalendarEvents,
};