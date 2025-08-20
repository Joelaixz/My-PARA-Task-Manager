// 檔案位置: electron/preload.ts
import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('ipcRenderer', {
  // --- (invoke 保持不變，但為了清晰，我們將它移到前面) ---
  invoke: (...args: Parameters<typeof ipcRenderer.invoke>) => {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },
  
  // --- 1. 新增點：將主題設定的函式橋接給前端 ---
  getTheme: (): Promise<string | null> => ipcRenderer.invoke('get-theme'),
  setTheme: (theme: string): Promise<void> => ipcRenderer.invoke('set-theme', theme),

  // --- (其他 API 保持不變) ---
  // 檔案操作
  getFiles: (directoryPath?: string): Promise<any> => ipcRenderer.invoke('get-files', directoryPath),
  readFile: (filePath: string): Promise<any> => ipcRenderer.invoke('read-file', filePath),
  saveFile: (filePath: string, content: string): Promise<boolean> => ipcRenderer.invoke('save-file', filePath, content),
  createFile: (parentDir: string, fileName: string, rootPath: string): Promise<any> => ipcRenderer.invoke('create-file', parentDir, fileName, rootPath),
  createFolder: (parentDir: string, folderName: string, rootPath: string): Promise<any> => ipcRenderer.invoke('create-folder', parentDir, folderName, rootPath),

  // Key-Value
  getMit: (): Promise<string | null> => ipcRenderer.invoke('get-mit'),
  setMit: (content: string): Promise<void> => ipcRenderer.invoke('set-mit', content),
  getLastPathForMode: (mode: string): Promise<string | null> => ipcRenderer.invoke('get-last-path-for-mode', mode),
  setLastPathForMode: (mode: string, path: string): Promise<void> => ipcRenderer.invoke('set-last-path-for-mode', { mode, path }),

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

  // 註解：on, off, send 這些單向或監聽的 API 我們暫時用不到，但保留著以備不時之需
  on: (...args: Parameters<typeof ipcRenderer.on>) => { const [channel, listener] = args; return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args)) },
  off: (...args: Parameters<typeof ipcRenderer.off>) => { const [channel, ...omit] = args; return ipcRenderer.off(channel, ...omit) },
  send: (...args: Parameters<typeof ipcRenderer.send>) => { const [channel, ...omit] = args; return ipcRenderer.send(channel, ...omit) },
})