/// <reference types="vite/client" />

// --- 新增點：引用 Electron 的 preload 型別定義 ---
// 目的：讓 Vue/Vite 這端的前端程式碼，能夠識別由 Electron preload.ts 腳本
//       附加到全域 window 物件上的 ipcRenderer 屬性及其所有方法。
// 為什麼：這樣做可以為所有 .vue 和 .ts 檔案提供完整的型別提示與安全檢查，
//         解決大量的 "Property 'ipcRenderer' does not exist on type 'Window'" 錯誤。
/// <reference types="../electron/electron-env" />

declare module 'path-browserify';