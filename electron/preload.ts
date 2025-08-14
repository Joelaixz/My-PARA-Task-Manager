import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
  
  // 檔案操作
  getFiles: (directoryPath?: string): Promise<any> => ipcRenderer.invoke('get-files', directoryPath),
  readFile: (filePath: string): Promise<string | null> => ipcRenderer.invoke('read-file', filePath),
  saveFile: (filePath: string, content: string): Promise<boolean> => ipcRenderer.invoke('save-file', filePath, content),
  createFile: (parentDir: string, fileName: string, rootPath: string): Promise<any> => ipcRenderer.invoke('create-file', parentDir, fileName, rootPath),
  createFolder: (parentDir: string, folderName: string, rootPath: string): Promise<any> => ipcRenderer.invoke('create-folder', parentDir, folderName, rootPath),

  // --- 新增：資料庫操作 ---
  getMit: (): Promise<string | null> => ipcRenderer.invoke('get-mit'),
  setMit: (content: string): Promise<void> => ipcRenderer.invoke('set-mit', content),
})