import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'
// --- 1. 引入 package.json ---
// 目的：讀取專案的依賴列表，以便自動將它們設定為外部依賴。
import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            // 目的：告訴 Vite/Rollup，不要將 node_modules 中的任何東西打包到 main.js 中。
            // 而是讓它們在執行時作為標準的 Node.js require() 來解析。
            // 這是 Electron 主行程打包的標準最佳實踐。
            rollupOptions: {
              external: [
                'electron',
                // --- 2. 動態設定所有生產依賴為外部依賴 ---
                ...Object.keys(pkg.dependencies || {})
              ],
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      renderer: process.env.NODE_ENV === 'test'
        ? undefined
        : {},
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/pdfjs-dist/build/pdf.worker.js',
          dest: '.'
        }
      ]
    })
  ],
})