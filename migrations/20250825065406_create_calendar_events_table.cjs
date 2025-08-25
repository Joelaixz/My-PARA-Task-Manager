/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // 目的：建立一個 'calendar_events' 資料表，用於儲存日曆中的待辦事項和事件。
  return knex.schema.createTable('calendar_events', (table) => {
    // 'id' 欄位：自動增長的主鍵 ID。
    table.increments('id').primary();
    
    // 'date' 欄位：儲存事件發生的日期。使用 date 型別。
    table.date('date').notNullable();
    
    // 'title' 欄位：儲存事件的標題。
    table.string('title').notNullable();

    // 'content' 欄位：儲存事件的詳細內容，支援較長的文字。
    table.text('content').notNullable().defaultTo('');

    // 'is_urgent_pin' 欄位：
    // 目的：標記此事件是否為「最急迫事項」釘選到儀表板。
    // 預設值為 false，表示預設不釘選。
    table.boolean('is_urgent_pin').notNullable().defaultTo(false);

    // 'is_future_reminder_pin' 欄位：
    // 目的：標記此事件是否為「未來提醒」釘選到儀表板。
    // 預設值為 false，表示預設不釘選。
    table.boolean('is_future_reminder_pin').notNullable().defaultTo(false);
    
    // 'created_at' 和 'updated_at' 欄位：自動記錄建立與更新的時間戳。
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // 目的：如果需要撤銷此遷移，則刪除 'calendar_events' 資料表。
  return knex.schema.dropTable('calendar_events');
};