import { defineStore } from 'pinia'

// 主 Store，用於管理應用程式級別的狀態
export const useMainStore = defineStore('main', {
  state: () => ({
    // 未來可以存放如：當前主題、使用者設定等
  }),
  getters: {},
  actions: {},
})

// 用於管理檔案狀態的 Store
export const useFileStore = defineStore('file', {
  state: (): { 
    selectedFilePath: string | null;
    selectedFolderPath: string | null;
    pendingEdit: boolean; // --- 1. 新增：待編輯狀態 ---
  } => ({
    selectedFilePath: null,
    selectedFolderPath: null,
    pendingEdit: false, // 預設為 false
  }),
  actions: {
    /**
     * 目的：設定當前選中的檔案路徑。
     * @param path - 被選中檔案的完整路徑，或傳入 null 來清除選中狀態。
     */
    selectFile(path: string | null) {
      this.selectedFilePath = path
    },

    /**
     * 目的：設定當前選中的資料夾路徑。
     * @param path - 被選中資料夾的完整路徑，或傳入 null 來清除選中狀態。
     */
    selectFolder(path: string | null) {
      this.selectedFolderPath = path;
    },

    // --- 2. 新增：用於設定待編輯狀態的 action ---
    /**
     * 目的：在選中檔案之前，先設定一個「待編輯」的標記。
     */
    setPendingEdit() {
      this.pendingEdit = true;
    },

    /**
     * 目的：完成編輯操作後，清除「待編輯」的標記。
     */
    clearPendingEdit() {
      this.pendingEdit = false;
    }
  },
})