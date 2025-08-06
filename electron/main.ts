import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

/**
 * 處理來自渲染行程的 'get-files' 請求。
 * 這個異步函數會做三件事：
 * 1. 透過 Electron 的 dialog API 開啟一個系統原生對話框，讓使用者選擇一個資料夾。
 * 2. 使用 Node.js 的 fs 模組，讀取該資料夾下的所有檔案與子資料夾。
 * 3. 過濾出所有以 '.md' 結尾的檔案，並將其檔名陣列回傳。
 */
async function handleFileOpen() {
  if (!win) {
    return []
  }
  // 1. 開啟對話框讓使用者選擇資料夾
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  })

  if (canceled || filePaths.length === 0) {
    return [] // 如果使用者取消或未選擇任何路徑，則回傳空陣列
  }

  const directoryPath = filePaths[0]

  // 2. 讀取資料夾內容
  try {
    const files = await fs.readdir(directoryPath)
    // 3. 篩選出 .md 檔案並回傳
    const markdownFiles = files.filter(file => file.endsWith('.md'))
    return markdownFiles
  } catch (error) {
    console.error('Error reading directory:', error)
    return [] // 若發生錯誤，回傳空陣列
  }
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    width: 1600,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 在應用程式準備好後才建立視窗與註冊 IPC 監聽器
app.whenReady().then(() => {
  // 註冊一個 IPC 監聽器
  // 當主行程收到從渲染行程發來，名為 'get-files' 的事件時，
  // 就會執行 handleFileOpen 函數，並將其回傳值送回給渲染行程。
  ipcMain.handle('get-files', handleFileOpen)

  createWindow()
})