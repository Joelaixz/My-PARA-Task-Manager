// 檔案位置: electron/electron-env.d.ts
// --- (其他型別定義保持不變) ---
interface ParsedTask { id: string; content: string; isCompleted: boolean; isPinned: boolean; dueDate: string | null; children: ParsedTask[]; }
interface TaskList { id: number; name: string; content: string; display_order: number; created_at: string; updated_at: string; }
interface ScratchpadNote { id: number; content: string; created_at: string; }
declare namespace NodeJS { interface ProcessEnv { APP_ROOT: string; VITE_PUBLIC: string; } }
interface FileEntry { name: string; path: string; isDirectory: boolean; children?: FileEntry[]; isExpanded?: boolean; }
interface ReadFileResult { content: string; isBinary: boolean; mimeType?: string; }


interface Window {
  ipcRenderer: {
    invoke(channel: string, ...args: any[]): Promise<any>
    
    // --- 1. 新增點：為新的複製功能提供型別定義 ---
    copyTextToClipboard(text: string): Promise<boolean>;

    // Theme
    getTheme(): Promise<string | null>;
    setTheme(theme: string): Promise<void>;
    
    // 檔案操作 (保持不變)
    getFiles(directoryPath?: string): Promise<{ folderName: string; files: FileEntry[]; rootPath: string } | null>
    readFile(filePath: string): Promise<ReadFileResult | null>
    saveFile(filePath: string, content: string): Promise<boolean>
    createFile(parentDir: string, fileName: string, rootPath: string): Promise<{ newPath: string; files: FileEntry[] } | null>
    createFolder(parentDir: string, folderName: string, rootPath: string): Promise<{ newPath: string; files: FileEntry[] } | null>

    // Key-Value (保持不變)
    getMit(): Promise<string | null>
    setMit(content: string): Promise<void>
    getLastPathForMode(mode: string): Promise<string | null>
    setLastPathForMode(mode: string, path: string): Promise<void>

    // Scratchpad Notes (保持不變)
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
    updateTaskListsOrder(orderedIds: number[]): Promise<boolean>
    
    // Markdown 解析 (保持不變)
    parseMarkdownTasks(markdownContent: string): Promise<ParsedTask[]>

    // on, off, send
    on(channel: string, listener: (event: import('electron').IpcRendererEvent, ...args: any[]) => void): import('electron').IpcRenderer;
    off(channel: string, ...args: any[]): import('electron').IpcRenderer;
    send(channel: string, ...args: any[]): void;
  }
}