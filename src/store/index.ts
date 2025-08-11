import { defineStore } from 'pinia'
import path from 'path-browserify'

export type SidebarMode = 'files' | 'personal' | 'projects' | 'areas' | 'resources' | 'archives';

export const useMainStore = defineStore('main', {
  state: () => ({
    sidebarMode: 'files' as SidebarMode,
    // --- 1. 新增狀態，用於記錄上一個模式 ---
    // 目的：當我們從 'personal' 切換到 'files' 時，這裡會保存 'personal'，以便之後可以返回。
    previousSidebarMode: null as SidebarMode | null,
  }),
  getters: {},
  actions: {
    /**
     * 目的：設定側邊欄的顯示模式，並智能記錄切換歷史。
     * @param mode - 要切換到的模式。
     */
    setSidebarMode(mode: SidebarMode) {
      // --- 2. 修改 Action 邏輯 ---
      // 當我們要切換到 'files' 模式，且當前模式不是 'files' 時，
      // 就把當前的模式存起來。
      if (mode === 'files' && this.sidebarMode !== 'files') {
        this.previousSidebarMode = this.sidebarMode;
      }
      this.sidebarMode = mode;
    },

    /**
     * --- 3. 新增 Action，用於返回 ---
     * 目的：從檔案總管模式返回到上一個專題模式。
     */
    restorePreviousSidebarMode() {
      if (this.previousSidebarMode) {
        this.sidebarMode = this.previousSidebarMode;
        this.previousSidebarMode = null; // 返回後清除記錄
      }
    }
  },
})

// FileStore 保持不變
export const useFileStore = defineStore('file', {
  state: (): { 
    selectedFilePath: string | null;
    selectedFolderPath: string | null;
    pendingEdit: boolean;
    expandedFolderPaths: Set<string>;
  } => ({
    selectedFilePath: null,
    selectedFolderPath: null,
    pendingEdit: false,
    expandedFolderPaths: new Set(),
  }),
  actions: {
    selectFile(path: string | null) {
      this.selectedFilePath = path
    },
    selectFolder(path: string | null) {
      this.selectedFolderPath = path;
    },
    setPendingEdit() {
      this.pendingEdit = true;
    },
    clearPendingEdit() {
      this.pendingEdit = false;
    },
    toggleFolderExpansion(folderPath: string) {
      if (this.expandedFolderPaths.has(folderPath)) {
        this.expandedFolderPaths.delete(folderPath);
      } else {
        this.expandedFolderPaths.add(folderPath);
      }
    },
    ensurePathIsExpanded(itemPath: string) {
      let currentPath = path.dirname(itemPath);
      while (currentPath && currentPath !== path.dirname(currentPath)) {
        this.expandedFolderPaths.add(currentPath);
        currentPath = path.dirname(currentPath);
      }
    },
    collapseAllFolders() {
      this.expandedFolderPaths.clear();
    }
  },
})