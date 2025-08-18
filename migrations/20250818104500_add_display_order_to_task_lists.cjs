// 檔案位置: migrations/20250818104500_add_display_order_to_task_lists.cjs

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // 為什麼：使用 alterTable 來修改現有的 task_lists 表格，而不是建立新表。
  return knex.schema.alterTable('task_lists', (table) => {
    // 目的：新增一個 display_order 欄位，用來儲存任務清單的顯示順序。
    // 型別：使用 integer (整數)。
    // 屬性：
    //   - notNullable(): 確保每一筆紀錄都必須有排序值。
    //   - defaultTo(0): 為現有的資料提供一個預設值，避免資料庫出錯。
    table.integer('display_order').notNullable().defaultTo(0);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // 為什麼：down 函式提供了回復（rollback）的功能，是遷移檔案的最佳實踐。
  return knex.schema.alterTable('task_lists', (table) => {
    // 目的：如果需要撤銷這次的變更，就移除 display_order 欄位。
    table.dropColumn('display_order');
  });
};