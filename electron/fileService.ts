// 檔案位置: electron/fileService.ts
import path from 'node:path';
import fs from 'node:fs/promises';
import { dialog } from 'electron';
import isBinaryPath from 'is-binary-path';

// --- (其他型別定義與函式保持不變) ---
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

async function getFiles(win: Electron.BrowserWindow | null, directoryPath?: string) {
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

async function readFile(filePath: string): Promise<ReadFileResult | null> {
  try {
    const extension = path.extname(filePath).toLowerCase();
    const binaryMimeTypes: { [key: string]: string } = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.svg': 'image/svg+xml', 
    };
    if (binaryMimeTypes[extension] || isBinaryPath(filePath)) {
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

async function saveFile(filePath: string, content: string): Promise<boolean> {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error saving file: ${filePath}`, error);
    return false;
  }
}

async function createFile(parentDir: string, fileName: string, rootPath: string) {
  if (!fileName || fileName.includes('/') || fileName.includes('\\') || !rootPath) {
    return null;
  }
  const fullPath = path.join(parentDir, fileName);
  try {
    await fs.writeFile(fullPath, '', { flag: 'wx' });
    const updatedFiles = await readDirectoryRecursively(rootPath);
    return { newPath: fullPath, files: updatedFiles };
  } catch (error) {
    console.error(`Error creating file: ${fullPath}`, error);
    return null;
  }
}

async function createFolder(parentDir: string, folderName: string, rootPath: string) {
  if (!folderName || folderName.includes('/') || folderName.includes('\\') || !rootPath) {
    return null;
  }
  const fullPath = path.join(parentDir, folderName);
  try {
    await fs.mkdir(fullPath, { recursive: false });
    const updatedFiles = await readDirectoryRecursively(rootPath);
    return { newPath: fullPath, files: updatedFiles };
  } catch (error) {
    console.error(`Error creating folder: ${fullPath}`, error);
    return null;
  }
}

// --- 1. 新增：刪除檔案或資料夾的函式 ---
/**
 * 目的：從檔案系統中刪除一個指定的檔案或資料夾。
 * @param entryPath - 要刪除的項目的完整路徑。
 * @returns {Promise<boolean>} - 操作是否成功。
 */
async function deleteEntry(entryPath: string): Promise<boolean> {
  try {
    // 為什麼：使用 fs.rm 搭配 { recursive: true, force: true }
    //         可以確保無論是檔案還是非空資料夾都能被安全地刪除。
    await fs.rm(entryPath, { recursive: true, force: true });
    return true;
  } catch (error) {
    console.error(`Error deleting entry: ${entryPath}`, error);
    return false;
  }
}

// --- 2. 新增：重新命名檔案或資料夾的函式 ---
/**
 * 目的：將一個檔案或資料夾重新命名。
 * @param oldPath - 原始的完整路徑。
 * @param newName - 新的名稱 (不含路徑)。
 * @returns {Promise<string | null>} - 如果成功，返回新的完整路徑；否則返回 null。
 */
async function renameEntry(oldPath: string, newName: string): Promise<string | null> {
  // 為什麼：先用 path.dirname 取得父目錄，再用 path.join 組合出新的完整路徑，
  //         這是處理路徑最可靠的方式，可以避免平台差異。
  const parentDir = path.dirname(oldPath);
  const newPath = path.join(parentDir, newName);

  try {
    await fs.rename(oldPath, newPath);
    return newPath;
  } catch (error) {
    console.error(`Error renaming from ${oldPath} to ${newPath}`, error);
    return null;
  }
}

// 目的：將所有檔案操作函式包裝成一個 'fileService' 物件並匯出。
export const fileService = {
  getFiles,
  readFile,
  saveFile,
  createFile,
  createFolder,
  // --- 3. 新增點：將新函式加入匯出物件中 ---
  deleteEntry,
  renameEntry,
};