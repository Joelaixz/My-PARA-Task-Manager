import { ipcRenderer, contextBridge } from 'electron'

// --------- 將部分 API 暴露給渲染行程 ---------
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
  getFiles: (): Promise<any> => ipcRenderer.invoke('get-files'),
  
  readFile: (filePath: string): Promise<string | null> => ipcRenderer.invoke('read-file', filePath),

  // --- 新增：暴露存檔函式給渲染行程 ---
  // 目的：讓 Vue 應用可以呼叫主行程的 'save-file' 事件。
  // 參數：
  //   - filePath: 要儲存的檔案的絕對路徑。
  //   - content:  要寫入的檔案內容。
  // 回傳值：
  //   - Promise<boolean>: 一個解析為布林值的 Promise，true 代表成功，false 代表失敗。
  saveFile: (filePath: string, content: string): Promise<boolean> => ipcRenderer.invoke('save-file', filePath, content),
})