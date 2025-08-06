/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string
    VITE_PUBLIC: string
  }
}

// 用於渲染行程，在 `preload.ts` 中暴露
interface Window {
  ipcRenderer: {
    on(...args: Parameters<import('electron').IpcRenderer['on']>): import('electron').IpcRenderer
    off(...args: Parameters<import('electron').IpcRenderer['off']>): import('electron').IpcRenderer
    send(...args: Parameters<import('electron').IpcRenderer['send']>): void
    invoke(...args: Parameters<import('electron').IpcRenderer['invoke']>): Promise<any>
    getFiles(): Promise<string[]>
  }
}