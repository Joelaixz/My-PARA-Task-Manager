import { app, BrowserWindow, ipcMain, dialog, session, shell } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import isBinaryPath from 'is-binary-path'

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

async function handleGetFiles(event: Electron.IpcMainInvokeEvent, directoryPath?: string) {
  let selectedPath = directoryPath;

  if (!selectedPath) {
    if (!win) return null;
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    });
    if (canceled || filePaths.length === 0) {
      return null;
    }
    selectedPath = filePaths[0];
  }

  if (!selectedPath) return null;

  const folderName = path.basename(selectedPath);
  try {
    const files = await readDirectoryRecursively(selectedPath);
    return { folderName, files, rootPath: selectedPath };
  } catch (error) {
    console.error(`Error reading directory: ${selectedPath}`, error);
    return null;
  }
}

async function handleReadFile(event: Electron.IpcMainInvokeEvent, filePath: string): Promise<ReadFileResult | null> {
  try {
    if (isBinaryPath(filePath)) {
       const binaryMimeTypes: { [key: string]: string } = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
      };
      const extension = path.extname(filePath).toLowerCase();
      const buffer = await fs.readFile(filePath);
      const content = buffer.toString('base64');
      return {
        content,
        isBinary: true,
        mimeType: binaryMimeTypes[extension] || 'application/octet-stream',
      };
    } else {
      const content = await fs.readFile(filePath, 'utf-8');
      return { content, isBinary: false };
    }
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

// --- 1. 修改建立檔案/資料夾的函式 ---
async function handleCreateFile(event: Electron.IpcMainInvokeEvent, parentDir: string, fileName: string, rootPath: string) {
  if (!fileName || fileName.includes('/') || fileName.includes('\\') || !rootPath) {
    return null;
  }
  const fullPath = path.join(parentDir, fileName);
  try {
    await fs.writeFile(fullPath, '', { flag: 'wx' });
    // 建立成功後，立即重新讀取整個檔案樹
    const updatedFiles = await readDirectoryRecursively(rootPath);
    // 回傳新路徑和更新後的檔案樹
    return { newPath: fullPath, files: updatedFiles };
  } catch (error) {
    console.error(`Error creating file: ${fullPath}`, error);
    return null;
  }
}

async function handleCreateFolder(event: Electron.IpcMainInvokeEvent, parentDir: string, folderName: string, rootPath: string) {
  if (!folderName || folderName.includes('/') || folderName.includes('\\') || !rootPath) {
    return null;
  }
  const fullPath = path.join(parentDir, folderName);
  try {
    await fs.mkdir(fullPath, { recursive: false });
    // 建立成功後，立即重新讀取整個檔案樹
    const updatedFiles = await readDirectoryRecursively(rootPath);
    // 回傳新路徑和更新後的檔案樹
    return { newPath: fullPath, files: updatedFiles };
  } catch (error) {
    console.error(`Error creating folder: ${fullPath}`, error);
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
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"]
      }
    })
  })

  ipcMain.handle('get-files', handleGetFiles)
  ipcMain.handle('read-file', handleReadFile)
  ipcMain.handle('save-file', handleFileSave)

  ipcMain.handle('create-file', handleCreateFile)
  ipcMain.handle('create-folder', handleCreateFolder)
  
  createWindow()
})