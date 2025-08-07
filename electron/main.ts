// --- 1. 從 'electron' 匯入 'shell' 模組 ---
import { app, BrowserWindow, ipcMain, dialog, session, shell } from 'electron'
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

// (interface FileEntry, ReadFileResult, and other functions remain the same)
interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
}
interface ReadFileResult {
  content: string;
  isBinary: boolean;
  mimeType?: string;
}
const ALLOWED_EXTENSIONS = ['.md', '.txt', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.pdf'];
const MAX_RECURSION_DEPTH = 5;
async function readDirectoryRecursively(dirPath: string, currentDepth = 0): Promise<FileEntry[]> {
  if (currentDepth >= MAX_RECURSION_DEPTH) {
    return [];
  }
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files: FileEntry[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }
    if (entry.isDirectory()) {
      files.push({
        name: entry.name,
        path: fullPath,
        isDirectory: true,
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
async function handleReadFile(event: Electron.IpcMainInvokeEvent, filePath: string): Promise<ReadFileResult | null> {
  try {
    const extension = path.extname(filePath).toLowerCase();
    const textExtensions = ['.md', '.txt'];
    const binaryMimeTypes: { [key: string]: string } = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
    };
    if (textExtensions.includes(extension)) {
      const content = await fs.readFile(filePath, 'utf-8');
      return { content, isBinary: false };
    } else if (binaryMimeTypes[extension]) {
      const buffer = await fs.readFile(filePath);
      const content = buffer.toString('base64');
      return {
        content,
        isBinary: true,
        mimeType: binaryMimeTypes[extension],
      };
    }
    console.warn(`Attempted to read unsupported file type: ${filePath}`);
    return null;
  } catch (error) {
    console.error(`Error reading file: ${filePath}`, error);
    return null;
  }
}
async function handleFileSave(event: Electron.IpcMainInvokeEvent, filePath: string, content: string): Promise<boolean> {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error saving file: ${filePath}`, error);
    return false;
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

  // --- 2. 新增：監聽 webContents 的事件 ---
  // 目的：攔截所有在新視窗開啟的意圖 (例如 target="_blank") 和導航事件
  win.webContents.setWindowOpenHandler(({ url }) => {
    // 檢查是否為外部連結
    if (url.startsWith('http:') || url.startsWith('https:')) {
      // 使用 shell 模組在系統預設瀏覽器中開啟
      shell.openExternal(url)
      // 阻止 Electron 建立新視窗
      return { action: 'deny' }
    }
    // 對於內部連結或協議，可以允許
    return { action: 'allow' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    // 同樣的邏輯應用於當前視窗的導航事件
    if (url.startsWith('http:') || url.startsWith('https:')) {
      event.preventDefault() // 阻止在 App 內部導航
      shell.openExternal(url) // 在外部瀏覽器開啟
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
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"]
      }
    })
  })

  ipcMain.handle('get-files', handleFileOpen)
  ipcMain.handle('read-file', handleReadFile)
  ipcMain.handle('save-file', handleFileSave)
  createWindow()
})