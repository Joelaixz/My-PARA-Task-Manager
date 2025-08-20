// 檔案位置: src/store/index.ts
import { defineStore } from 'pinia'
import path from 'path-browserify'

// --- 1. 新增點：定義主題型別 ---
export type Theme = 'light' | 'dark';

// --- (其他型別定義保持不變) ---
export interface ParsedTask {
  id: string;
  content: string;
  isCompleted: boolean;
  isPinned: boolean;
  dueDate: string | null;
  children: ParsedTask[];
}
export interface PinnedTask extends ParsedTask {
  sourceList: string;
  sourceListId: number;
}
export type SidebarMode = 'files' | 'personal' | 'projects' | 'areas' | 'resources' | 'archives';
export type PersonalViewType = '今日焦點' | '任務清單' | '未來日誌';

export const useMainStore = defineStore('main', {
  state: () => ({
    // --- 2. 新增點：建立儲存主題的狀態 ---
    theme: 'dark' as Theme,
    sidebarMode: 'files' as SidebarMode,
    previousSidebarMode: null as SidebarMode | null,
    activePersonalView: '今日焦點' as PersonalViewType,
    pinnedTasks: [] as PinnedTask[],
    isLoadingPinnedTasks: false,
  }),
  getters: {
    totalPinnedTasks: (state): number => {
      return state.pinnedTasks.length;
    },
    completedPinnedTasks: (state): number => {
      return state.pinnedTasks.filter(task => task.isCompleted).length;
    },
  },
  actions: {
    // --- 3. 新增點：建立初始化主題的 Action ---
    // 目的：在應用程式啟動時，從後端讀取儲存的主題偏好設定。
    async initTheme() {
      // 註解：我們假設 preload.ts 中會有一個 'get-theme' 的 IPC 通道
      const savedTheme = await window.ipcRenderer.invoke('get-theme') as Theme | null;
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        this.theme = savedTheme;
      }
      // 為什麼：將主題狀態應用到 HTML 的根元素上，這是觸發 CSS 變數切換的關鍵。
      document.documentElement.setAttribute('data-theme', this.theme);
    },

    // --- 4. 新增點：建立切換主題的 Action ---
    // 目的：提供一個統一的方法來切換主題，並將結果持久化。
    async toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', this.theme);
      // 註解：我們假設 preload.ts 中會有一個 'set-theme' 的 IPC 通道
      await window.ipcRenderer.invoke('set-theme', this.theme);
    },

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
    setActivePersonalView(view: PersonalViewType) {
      this.activePersonalView = view;
    },
    async fetchPinnedTasks() {
      this.isLoadingPinnedTasks = true;
      try {
        const allLists = await window.ipcRenderer.getTaskLists();
        let allPinnedTasks: PinnedTask[] = [];
        const findPinned = (tasks: ParsedTask[], sourceName: string, sourceId: number): PinnedTask[] => {
          let results: PinnedTask[] = [];
          for (const task of tasks) {
            if (task.isPinned) {
              results.push({ ...task, sourceList: sourceName, sourceListId: sourceId });
            }
            if (task.children && task.children.length > 0) {
              results = results.concat(findPinned(task.children, sourceName, sourceId));
            }
          }
          return results;
        };
        for (const list of allLists) {
          if (list.content) {
            const parsed = await window.ipcRenderer.parseMarkdownTasks(list.content);
            const pinned = findPinned(parsed, list.name, list.id);
            allPinnedTasks = allPinnedTasks.concat(pinned);
          }
        }
        this.pinnedTasks = allPinnedTasks;
      } catch (error) {
        console.error("Failed to load pinned tasks in store:", error);
        this.pinnedTasks = [];
      } finally {
        this.isLoadingPinnedTasks = false;
      }
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
    selectFile(path: string | null) { this.selectedFilePath = path },
    selectFolder(path: string | null) { this.selectedFolderPath = path; },
    setPendingEdit() { this.pendingEdit = true; },
    clearPendingEdit() { this.pendingEdit = false; },
    toggleFolderExpansion(folderPath: string) { if (this.expandedFolderPaths.has(folderPath)) { this.expandedFolderPaths.delete(folderPath); } else { this.expandedFolderPaths.add(folderPath); } },
    ensurePathIsExpanded(itemPath: string) { let currentPath = path.dirname(itemPath); while (currentPath && currentPath !== path.dirname(currentPath)) { this.expandedFolderPaths.add(currentPath); currentPath = path.dirname(currentPath); } },
    collapseAllFolders() { this.expandedFolderPaths.clear(); }
  },
})