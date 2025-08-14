import { app, BrowserWindow, ipcMain, session, shell } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import knex, { type Knex } from 'knex'
import { databaseService } from './databaseService'
import { fileService } from './fileService'

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

  // --- 3. 修改 IPC 處理程序，改為呼叫對應的服務 ---
  
  // 檔案操作 (呼叫 fileService)
  ipcMain.handle('get-files', (event, directoryPath?: string) => fileService.getFiles(win, directoryPath))
  ipcMain.handle('read-file', (event, filePath: string) => fileService.readFile(filePath))
  ipcMain.handle('save-file', (event, filePath: string, content: string) => fileService.saveFile(filePath, content))
  ipcMain.handle('create-file', (event, parentDir: string, fileName: string, rootPath: string) => fileService.createFile(parentDir, fileName, rootPath))
  ipcMain.handle('create-folder', (event, parentDir: string, folderName: string, rootPath: string) => fileService.createFolder(parentDir, folderName, rootPath))
  
  // 資料庫操作 (呼叫 databaseService)
  ipcMain.handle('get-mit', () => databaseService.getValue(db, 'mit'))
  ipcMain.handle('set-mit', (event, content: string) => databaseService.setValue(db, 'mit', content))
})