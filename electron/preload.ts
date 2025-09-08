// 檔案位置: electron/preload.ts
import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('ipcRenderer', {
  invoke: (...args: Parameters<typeof ipcRenderer.invoke>) => {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },
  
  copyTextToClipboard: (text: string): Promise<boolean> => ipcRenderer.invoke('copy-text-to-clipboard', text),

  // Theme
  getTheme: (): Promise<string | null> => ipcRenderer.invoke('get-theme'),
  setTheme: (theme: string): Promise<void> => ipcRenderer.invoke('set-theme', theme),

  // 檔案操作
  getFiles: (directoryPath?: string): Promise<any> => ipcRenderer.invoke('get-files', directoryPath),
  readFile: (filePath: string): Promise<any> => ipcRenderer.invoke('read-file', filePath),
  saveFile: (filePath: string, content: string): Promise<boolean> => ipcRenderer.invoke('save-file', filePath, content),
  createFile: (parentDir: string, fileName: string, rootPath: string): Promise<any> => ipcRenderer.invoke('create-file', parentDir, fileName, rootPath),
  createFolder: (parentDir: string, folderName: string, rootPath: string): Promise<any> => ipcRenderer.invoke('create-folder', parentDir, folderName, rootPath),
  // --- 1. 新增點：暴露刪除和重新命名的函式 ---
  deleteEntry: (entryPath: string): Promise<boolean> => ipcRenderer.invoke('delete-entry', entryPath),
  renameEntry: (oldPath: string, newName: string): Promise<string | null> => ipcRenderer.invoke('rename-entry', { oldPath, newName }),

  // Key-Value
  getMit: (): Promise<string | null> => ipcRenderer.invoke('get-mit'),
  setMit: (content: string): Promise<void> => ipcRenderer.invoke('set-mit', content),
  getLastPathForMode: (mode: string): Promise<string | null> => ipcRenderer.invoke('get-last-path-for-mode', mode),
  setLastPathForMode: (mode: string, path: string): Promise<void> => ipcRenderer.invoke('set-last-path-for-mode', { mode, path }),
  getLastFileForMode: (mode: string): Promise<string | null> => ipcRenderer.invoke('get-last-file-for-mode', mode),
  setLastFileForMode: (mode: string, path: string): Promise<void> => ipcRenderer.invoke('set-last-file-for-mode', { mode, path }),

  // Scratchpad Notes
  getScratchpadNotes: (): Promise<any[]> => ipcRenderer.invoke('get-scratchpad-notes'),
  addScratchpadNote: (content: string): Promise<any> => ipcRenderer.invoke('add-scratchpad-note', content),
  updateScratchpadNote: (id: number, content: string): Promise<any> => ipcRenderer.invoke('update-scratchpad-note', id, content),
  deleteScratchpadNote: (id: number): Promise<boolean> => ipcRenderer.invoke('delete-scratchpad-note', id),

  // Task Lists
  getTaskLists: (): Promise<any[]> => ipcRenderer.invoke('get-task-lists'),
  getTaskList: (id: number): Promise<any | null> => ipcRenderer.invoke('get-task-list', id),
  createTaskList: (name: string): Promise<any> => ipcRenderer.invoke('create-task-list', name),
  updateTaskListContent: (id: number, content: string): Promise<any | null> => ipcRenderer.invoke('update-task-list-content', id, content),
  deleteTaskList: (id: number): Promise<boolean> => ipcRenderer.invoke('delete-task-list', id),
  updateTaskListsOrder: (orderedIds: number[]): Promise<boolean> => ipcRenderer.invoke('update-task-lists-order', orderedIds),

  // Markdown 解析
  parseMarkdownTasks: (markdownContent: string): Promise<any[]> => ipcRenderer.invoke('parse-markdown-tasks', { content: markdownContent }),

  // 日曆事件
  getCalendarEventsByMonth: (year: number, month: number): Promise<any[]> => ipcRenderer.invoke('get-calendar-events-by-month', { year, month }),
  addCalendarEvent: (event: any): Promise<any> => ipcRenderer.invoke('add-calendar-event', event),
  updateCalendarEvent: (id: number, updates: any): Promise<any | null> => ipcRenderer.invoke('update-calendar-event', { id, updates }),
  deleteCalendarEvent: (id: number): Promise<boolean> => ipcRenderer.invoke('delete-calendar-event', id),
  getPinnedCalendarEvents: (): Promise<PinnedCalendarEvents> => ipcRenderer.invoke('get-pinned-calendar-events'),
  getGlobalPinStatus: (): Promise<PinStatus> => ipcRenderer.invoke('get-global-pin-status'),

  // on, off, send
  on: (...args: Parameters<typeof ipcRenderer.on>) => { const [channel, listener] = args; return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args)) },
  off: (...args: Parameters<typeof ipcRenderer.off>) => { const [channel, ...omit] = args; return ipcRenderer.off(channel, ...omit) },
  send: (...args: Parameters<typeof ipcRenderer.send>) => { const [channel, ...omit] = args; return ipcRenderer.send(channel, ...omit) },
})