/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('scratchpad_notes', (table) => {
    // 'id' 欄位：使用 increments() 來建立一個自動增長的主鍵 ID。
    table.increments('id').primary();
    
    // 'content' 欄位：儲存筆記的文字內容。
    table.text('content');
    
    // 'created_at' 欄位：使用 knex.fn.now() 自動記錄筆記建立時的時間戳，並設定為不可為空。
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('scratchpad_notes');
};