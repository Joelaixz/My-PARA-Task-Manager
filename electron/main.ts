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

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
}

const ALLOWED_EXTENSIONS = ['.md', '.txt', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.pdf'];
const MAX_RECURSION_DEPTH = 5; // 用於限制讀取資料夾的層級深度

/**
 * 目的：遞迴讀取指定路徑下的目錄結構。
 * @param dirPath - 要讀取的資料夾路徑。
 * @param currentDepth - 目前的遞迴深度，用於防止無限遞迴。
 * @returns 回傳一個 Promise，其解析值為檔案/資料夾結構的陣列。
 */
async function readDirectoryRecursively(dirPath: string, currentDepth = 0): Promise<FileEntry[]> {
  // 如果達到最大深度，則回傳空陣列，停止繼續讀取
  if (currentDepth >= MAX_RECURSION_DEPTH) {
    return [];
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files: FileEntry[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    // 忽略常見的、不需要顯示的資料夾或隱藏檔案
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push({
        name: entry.name,
        path: fullPath,
        isDirectory: true,
        // 遞迴呼叫時，將深度計數器加一
        children: await readDirectoryRecursively(fullPath, currentDepth + 1)
      });
    } else {
      const fileExtension = path.extname(entry.name).toLowerCase();
      if (ALLOWED_EXTENSIONS.includes(fileExtension)) {
        files.push({
          name: entry.name,
          path: fullPath,
          isDirectory: false
        });
      }
    }
  }
  
  // 排序，讓資料夾總是在檔案前面
  return files.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
}

async function handleFileOpen() {
  if (!win) {
    return null
  }
  
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  })

  if (canceled || filePaths.length === 0) {
    return null
  }

  const directoryPath = filePaths[0]
  const folderName = path.basename(directoryPath)

  try {
    const files = await readDirectoryRecursively(directoryPath)
    return { folderName, files }
  } catch (error) {
    console.error('Error reading directory:', error)
    return null
  }
}

async function handleReadFile(event: Electron.IpcMainInvokeEvent, filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error reading file: ${filePath}`, error);
    return null;
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

app.whenReady().then(() => {
  ipcMain.handle('get-files', handleFileOpen)
  ipcMain.handle('read-file', handleReadFile)
  createWindow()
})