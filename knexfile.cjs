// 檔案名稱: knexfile.cjs
const path = require('path');

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
const config = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'app-data.db')
    },
    migrations: {
      directory: './migrations'
      // 註解：我們移除了 extension: 'ts' 這一行。
      // Knex 現在會預設尋找並建立 .js 遷移檔案。
    },
    useNullAsDefault: true
  }
};

module.exports = config;