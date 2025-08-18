// 檔案位置: src/store/index.ts
import { defineStore } from 'pinia'
import path from 'path-browserify'

// --- 1. 新增點：定義共享的任務型別 ---
// 目的：讓 store 和各個元件對資料結構有統一的認知。
// 註解：從 TodayTasksCard.vue 提取並擴充 ParsedTask 型別。
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
    sidebarMode: 'files' as SidebarMode,
    previousSidebarMode: null as SidebarMode | null,
    activePersonalView: '今日焦點' as PersonalViewType,
    // --- 2. 新增點：建立儲存釘選任務的狀態 ---
    pinnedTasks: [] as PinnedTask[],
    isLoadingPinnedTasks: false,
  }),
  // --- 3. 新增點：建立計算屬性 (Getters) ---
  // 目的：提供給 WelcomeHeader.vue 直接使用的計算結果。
  getters: {
    totalPinnedTasks: (state): number => {
      // 為什麼：直接回傳陣列長度，簡單高效。
      return state.pinnedTasks.length;
    },
    completedPinnedTasks: (state): number => {
      // 為什麼：使用 filter().length 來計算已完成的任務數量。
      return state.pinnedTasks.filter(task => task.isCompleted).length;
    },
  },
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
    setActivePersonalView(view: PersonalViewType) {
      this.activePersonalView = view;
    },
    // --- 4. 新增點：建立獲取釘選任務的 Action ---
    // 目的：將獲取和解析釘選任務的邏輯集中到 store 中，避免重複程式碼。
    async fetchPinnedTasks() {
      this.isLoadingPinnedTasks = true;
      try {
        const allLists = await window.ipcRenderer.getTaskLists();
        let allPinnedTasks: PinnedTask[] = [];

        // 遞迴尋找釘選任務的輔助函式
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
        this.pinnedTasks = []; // 發生錯誤時清空
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