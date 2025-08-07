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
    
    getFiles(): Promise<{ folderName: string; files: FileEntry[] } | null>
    
    readFile(filePath: string): Promise<ReadFileResult | null>

    // --- 新增：saveFile 函式的型別定義 ---
    // 讓 TypeScript 知道這個函式的存在、參數及回傳值型別。
    saveFile(filePath: string, content: string): Promise<boolean>
  }
}