// 1. 在檔案頂部引入 ScratchpadNote 型別
interface ScratchpadNote {
  id: number;
  content: string;
  created_at: string;
}

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string
    VITE_PUBLIC: string
  }
}

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
  isExpanded?: boolean; 
}

interface ReadFileResult {
  content: string;
  isBinary: boolean;
  mimeType?: string;
}

interface Window {
  ipcRenderer: {
    on(...args: Parameters<import('electron').IpcRenderer['on']>): import('electron').IpcRenderer
    off(...args: Parameters<import('electron').IpcRenderer['off']>): import('electron').IpcRenderer
    send(...args: Parameters<import('electron').IpcRenderer['send']>): void
    invoke(...args: Parameters<import('electron').IpcRenderer['invoke']>): Promise<any>
    
    // 檔案操作
    getFiles(directoryPath?: string): Promise<{ folderName: string; files: FileEntry[]; rootPath: string } | null>
    readFile(filePath: string): Promise<ReadFileResult | null>
    saveFile(filePath: string, content: string): Promise<boolean>
    createFile(parentDir: string, fileName: string, rootPath: string): Promise<{ newPath: string; files: FileEntry[] } | null>
    createFolder(parentDir: string, folderName: string, rootPath: string): Promise<{ newPath: string; files: FileEntry[] } | null>

    // Key-Value
    getMit(): Promise<string | null>
    setMit(content: string): Promise<void>

    // --- 2. 新增：Scratchpad Notes 的型別定義 ---
    getScratchpadNotes(): Promise<ScratchpadNote[]>
    addScratchpadNote(content: string): Promise<ScratchpadNote>
    updateScratchpadNote(id: number, content: string): Promise<ScratchpadNote | null>
    deleteScratchpadNote(id: number): Promise<boolean>
  }
}