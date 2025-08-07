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

// --- 新增：定義從主行程讀取檔案後的回傳格式 ---
// 目的：統一文字與二進位檔案的回傳結構，方便渲染行程處理。
interface ReadFileResult {
  content: string;    // 檔案內容。若是二進位則為 Base64 編碼字串。
  isBinary: boolean;  // 標記內容是否為二進位格式。
  mimeType?: string;  // 如果是二進位檔案，則提供其 MIME 類型。
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
    
    // --- 修改：更新 readFile 的回傳型別 ---
    readFile(filePath: string): Promise<ReadFileResult | null>
  }
}