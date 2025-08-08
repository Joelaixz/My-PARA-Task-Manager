/// <reference types="vite/client" />

// --- 新增：為 path-browserify 模組提供基礎宣告 ---
// 目的：解決 TypeScript 找不到 'path-browserify' 模組型別定義的錯誤。
// 說明：這是一個臨時的解決方案，它會讓 TypeScript 停止報錯，但不會提供詳細的型別資訊。
//      更完整的方案是執行 `npm i --save-dev @types/path-browserify`。
declare module 'path-browserify';