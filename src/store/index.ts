import { defineStore } from 'pinia'
import path from 'path-browserify'

export type SidebarMode = 'files' | 'personal' | 'projects' | 'areas' | 'resources' | 'archives';
export type PersonalViewType = '今日焦點' | '任務清單' | '未來日誌'; // 定義個人視圖的類型

export const useMainStore = defineStore('main', {
  state: () => ({
    sidebarMode: 'files' as SidebarMode,
    previousSidebarMode: null as SidebarMode | null,
    // --- 1. 新增狀態，追蹤個人儀表板中的當前活動視圖 ---
    activePersonalView: '今日焦點' as PersonalViewType,
  }),
  getters: {},
  actions: {
    setSidebarMode(mode: SidebarMode) {
      if (mode === 'files' && this.sidebarMode !== 'files') {
        this.previousSidebarMode = this.sidebarMode;
      }
      this.sidebarMode = mode;
    },
    restorePreviousSidebarMode() {
      if (this.previousSidebarMode) {
        this.sidebarMode = this.previousSidebarMode;
        this.previousSidebarMode = null;
      }
    },
    // --- 2. 新增 Action，用於設定當前的個人視圖 ---
    setActivePersonalView(view: PersonalViewType) {
      this.activePersonalView = view;
    },
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