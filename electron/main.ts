// 檔案位置: electron/main.ts
import { app, BrowserWindow, ipcMain, session, shell } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import knex, { type Knex } from 'knex'
import { databaseService } from './databaseService'
import { fileService } from './fileService'
import { parseMarkdownToTasks } from './markdownTaskParser'

const require = createRequire(import.meta.url)
const knexConfig: { [key: string]: Knex.Config } = require('../knexfile.cjs');

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

const dbPath = app.isPackaged 
  ? path.join(app.getPath('userData'), 'app-data.db') 
  : path.resolve(process.env.APP_ROOT, 'app-data.db');

const db = knex({
  ...knexConfig.development,
  connection: {
    filename: dbPath
  }
});

let win: BrowserWindow | null

function createWindow() {
  // ... (createWindow 函式內容保持不變)
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    width: 1600,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      event.preventDefault()
      shell.openExternal(url)
    }
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

app.whenReady().then(() => {
  console.log(`Database path at: ${dbPath}`);
  db.migrate.latest()
    .then(() => {
      console.log('Database migration completed successfully.');
      createWindow()
    })
    .catch((error) => {
      console.error('Database migration failed:', error);
      app.quit();
    });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"]
      }
    })
  })

  // 檔案操作 (保持不變)
  ipcMain.handle('get-files', (event, directoryPath?: string) => fileService.getFiles(win, directoryPath))
  ipcMain.handle('read-file', (event, filePath: string) => fileService.readFile(filePath))
  ipcMain.handle('save-file', (event, filePath: string, content: string) => fileService.saveFile(filePath, content))
  ipcMain.handle('create-file', (event, parentDir: string, fileName: string, rootPath: string) => fileService.createFile(parentDir, fileName, rootPath))
  ipcMain.handle('create-folder', (event, parentDir: string, folderName: string, rootPath: string) => fileService.createFolder(parentDir, folderName, rootPath))
  
  // 資料庫操作
  ipcMain.handle('get-mit', () => databaseService.getMit(db))
  ipcMain.handle('set-mit', (event, content: string) => databaseService.setMit(db, content))
  ipcMain.handle('get-last-path-for-mode', (event, mode: string) => databaseService.getLastPathForMode(db, mode));
  ipcMain.handle('set-last-path-for-mode', (event, { mode, path }: { mode: string, path: string }) => databaseService.setLastPathForMode(db, mode, path));

  // --- 1. 新增點：建立讀取與儲存主題的 IPC 通道 ---
  ipcMain.handle('get-theme', () => databaseService.getTheme(db));
  ipcMain.handle('set-theme', (event, theme: string) => databaseService.setTheme(db, theme));

  // 隨手筆記 (Scratchpad) (保持不變)
  ipcMain.handle('get-scratchpad-notes', () => databaseService.getAllScratchpadNotes(db))
  ipcMain.handle('add-scratchpad-note', (event, content: string) => databaseService.addScratchpadNote(db, content))
  ipcMain.handle('update-scratchpad-note', (event, id: number, content: string) => databaseService.updateScratchpadNote(db, id, content))
  ipcMain.handle('delete-scratchpad-note', (event, id: number) => databaseService.deleteScratchpadNote(db, id))
  
  // 任務清單 (Task Lists)
  ipcMain.handle('get-task-lists', () => databaseService.getTaskLists(db))
  ipcMain.handle('get-task-list', (event, id: number) => databaseService.getTaskList(db, id))
  ipcMain.handle('create-task-list', (event, name: string) => databaseService.createTaskList(db, name))
  ipcMain.handle('update-task-list-content', (event, id: number, content: string) => databaseService.updateTaskListContent(db, id, content))
  ipcMain.handle('delete-task-list', (event, id: number) => databaseService.deleteTaskList(db, id))
  ipcMain.handle('update-task-lists-order', (event, orderedIds: number[]) => {
    return databaseService.updateTaskListsOrder(db, orderedIds);
  });

  // Markdown 解析器 (保持不變)
  ipcMain.handle('parse-markdown-tasks', (event, { content }: { content: string }) => {
    const result = parseMarkdownToTasks(content);
    return result;
  });
})