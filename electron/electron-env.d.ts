declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string
    VITE_PUBLIC: string
  }
}

// 目的：讓主行程與渲染行程對資料結構有共同的認知。
interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
  // isExpanded 是稍後在渲染行程中動態加入的，在此定義為可選屬性
  isExpanded?: boolean; 
}

// 用於渲染行程，在 `preload.ts` 中暴露
interface Window {
  ipcRenderer: {
    on(...args: Parameters<import('electron').IpcRenderer['on']>): import('electron').IpcRenderer
    off(...args: Parameters<import('electron').IpcRenderer['off']>): import('electron').IpcRenderer
    send(...args: Parameters<import('electron').IpcRenderer['send']>): void
    invoke(...args: Parameters<import('electron').IpcRenderer['invoke']>): Promise<any>
    
    // 目的：將回傳型別與 main.ts 中的實際回傳值保持一致。
    getFiles(): Promise<{ folderName: string; files: FileEntry[] } | null>
    
    // --- 定義讀取檔案內容的函式型別 ---
    readFile(filePath: string): Promise<string | null>
  }
}