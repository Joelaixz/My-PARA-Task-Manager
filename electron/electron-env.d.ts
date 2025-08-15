// --- ParsedTask 型別 ---
interface ParsedTask {
  id: string;
  content: string;
  isCompleted: boolean;
  isPinned: boolean;
  dueDate: string | null; 
  children: ParsedTask[];
}

interface TaskList {
  id: number;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

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

    // Scratchpad Notes
    getScratchpadNotes(): Promise<ScratchpadNote[]>
    addScratchpadNote(content: string): Promise<ScratchpadNote>
    updateScratchpadNote(id: number, content: string): Promise<ScratchpadNote | null>
    deleteScratchpadNote(id: number): Promise<boolean>

    // Task Lists
    getTaskLists(): Promise<TaskList[]>
    getTaskList(id: number): Promise<TaskList | null>
    createTaskList(name: string): Promise<TaskList>
    updateTaskListContent(id: number, content: string): Promise<TaskList | null>
    deleteTaskList(id: number): Promise<boolean>
    
    // Markdown 解析
    parseMarkdownTasks(markdownContent: string): Promise<ParsedTask[]>
  }
}