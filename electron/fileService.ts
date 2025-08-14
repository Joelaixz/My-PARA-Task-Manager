// 檔案位置: electron/fileService.ts
import path from 'node:path';
import fs from 'node:fs/promises';
import { dialog } from 'electron';
import isBinaryPath from 'is-binary-path';

// --- 從 main.ts 遷移過來的型別定義 ---
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

// --- 從 main.ts 遷移過來的常數 ---
const ALLOWED_EXTENSIONS = ['.md', '.txt', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.pdf'];
const MAX_RECURSION_DEPTH = 5;

// --- 遷移過來的核心函式 ---

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

// 目的：將所有檔案操作函式包裝成一個 'fileService' 物件並匯出。
export const fileService = {
  getFiles,
  readFile,
  saveFile,
  createFile,
  createFolder,
};