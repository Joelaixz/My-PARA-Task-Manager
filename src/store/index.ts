import { defineStore } from 'pinia'
import path from 'path-browserify'

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
    pendingEdit: boolean;
    // --- 1. 新增：用一個 Set 來儲存所有展開的資料夾路徑 ---
    // 目的：集中管理檔案樹的展開狀態，作為唯一的狀態來源。
    expandedFolderPaths: Set<string>;
  } => ({
    selectedFilePath: null,
    selectedFolderPath: null,
    pendingEdit: false,
    expandedFolderPaths: new Set(),
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
    },

    // --- 2. 新增：管理資料夾展開狀態的 Actions ---

    /**
     * 目的：切換指定路徑資料夾的展開/收合狀態。
     * @param folderPath - 要切換狀態的資料夾路徑。
     */
    toggleFolderExpansion(folderPath: string) {
      if (this.expandedFolderPaths.has(folderPath)) {
        this.expandedFolderPaths.delete(folderPath);
      } else {
        this.expandedFolderPaths.add(folderPath);
      }
    },

    /**
     * 目的：確保給定路徑的所有父層資料夾都被設定為展開狀態。
     * @param itemPath - 新建立或需要被顯示的檔案/資料夾路徑。
     */
    ensurePathIsExpanded(itemPath: string) {
      let currentPath = path.dirname(itemPath);
      // 從該項目的父目錄開始，一路向上添加到根目錄
      while (currentPath && currentPath !== path.dirname(currentPath)) {
        this.expandedFolderPaths.add(currentPath);
        currentPath = path.dirname(currentPath);
      }
    },

    /**
     * 目的：清除所有資料夾的展開狀態。
     * 說明：通常在載入一個全新的根目錄時使用。
     */
    collapseAllFolders() {
      this.expandedFolderPaths.clear();
    }
  },
})