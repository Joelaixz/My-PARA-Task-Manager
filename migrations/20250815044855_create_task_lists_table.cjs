/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('task_lists', (table) => {
    // 'id' 欄位：自動增長的主鍵 ID。
    table.increments('id').primary();
    
    // 'name' 欄位：儲存任務清單的名稱，例如 "專案 A 發布檢查"。
    table.string('name').notNullable();
    
    // 'content' 欄位：用來儲存完整的 Markdown 原始文字內容。
    table.text('content').notNullable().defaultTo('');
    
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
  return knex.schema.dropTable('task_lists');
};