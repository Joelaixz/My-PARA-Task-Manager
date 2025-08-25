// 檔案位置: electron/electron-env.d.ts
// --- (其他型別定義保持不變) ---
interface ParsedTask { id: string; content: string; isCompleted: boolean; isPinned: boolean; dueDate: string | null; children: ParsedTask[]; }
interface TaskList { id: number; name: string; content: string; display_order: number; created_at: string; updated_at: string; }
interface ScratchpadNote { id: number; content: string; created_at: string; }
declare namespace NodeJS { interface ProcessEnv { APP_ROOT: string; VITE_PUBLIC: string; } }
interface FileEntry { name: string; path: string; isDirectory: boolean; children?: FileEntry[]; isExpanded?: boolean; }
interface ReadFileResult { content: string; isBinary: boolean; mimeType?: string; }
interface CalendarEvent {
  id: number;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  is_urgent_pin: boolean;
  is_future_reminder_pin: boolean;
  created_at: string;
  updated_at: string;
}
interface PinnedCalendarEvents {
  urgentEvent: CalendarEvent | null;
  futureEvent: CalendarEvent | null;
}
// 1. 修正：更新 PinStatus 的型別介面
interface PinStatus {
  urgentPinId: number | null;
  futureReminderPinId: number | null;
}

interface Window {
  ipcRenderer: {
    invoke(channel: string, ...args: any[]): Promise<any>
    
    // --- (其他 IPC 通道保持不變) ---
    copyTextToClipboard(text: string): Promise<boolean>;

    // Theme
    getTheme(): Promise<string | null>;
    setTheme(theme: string): Promise<void>;
    
    // 檔案操作
    getFiles(directoryPath?: string): Promise<{ folderName: string; files: FileEntry[]; rootPath: string } | null>
    readFile(filePath: string): Promise<ReadFileResult | null>
    saveFile(filePath: string, content: string): Promise<boolean>
    createFile(parentDir: string, fileName: string, rootPath: string): Promise<{ newPath: string; files: FileEntry[] } | null>
    createFolder(parentDir: string, folderName: string, rootPath: string): Promise<{ newPath: string; files: FileEntry[] } | null>

    // Key-Value
    getMit(): Promise<string | null>
    setMit(content: string): Promise<void>
    getLastPathForMode(mode: string): Promise<string | null>
    setLastPathForMode(mode: string, path: string): Promise<void>

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
    updateTaskListsOrder(orderedIds: number[]): Promise<boolean>
    
    // Markdown 解析
    parseMarkdownTasks(markdownContent: string): Promise<ParsedTask[]>

    // 日曆事件
    getCalendarEventsByMonth(year: number, month: number): Promise<CalendarEvent[]>;
    addCalendarEvent(event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent>;
    updateCalendarEvent(id: number, updates: Partial<Omit<CalendarEvent, 'id' | 'created_at'>>): Promise<CalendarEvent | null>;
    deleteCalendarEvent(id: number): Promise<boolean>;
    getPinnedCalendarEvents(): Promise<PinnedCalendarEvents>;
    // 2. 修正：更新 getGlobalPinStatus 的回傳型別
    getGlobalPinStatus(): Promise<PinStatus>;

    // on, off, send
    on(channel: string, listener: (event: import('electron').IpcRendererEvent, ...args: any[]) => void): import('electron').IpcRenderer;
    off(channel: string, ...args: any[]): import('electron').IpcRenderer;
    send(channel: string, ...args: any[]): void;
  }
}