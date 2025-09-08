// 檔案位置: src/store/index.ts
import { defineStore } from 'pinia'
import path from 'path-browserify'

export type Theme = 'light' | 'dark';

// --- 1. 簡化點：移除不再需要的型別定義 ---
// export interface ParsedTask { ... }
// export interface PinnedTask extends ParsedTask { ... }
export type SidebarMode = 'files' | 'personal' | 'projects' | 'areas' | 'resources' | 'archives';
// export type PersonalViewType = '今日焦點' | '任務清單' | '未來日誌';

export const useMainStore = defineStore('main', {
  // --- 2. 簡化點：移除所有與儀表板、任務相關的 state ---
  state: () => ({
    theme: 'dark' as Theme,
    sidebarMode: 'files' as SidebarMode,
    previousSidebarMode: null as SidebarMode | null,
    // activePersonalView: '今日焦點' as PersonalViewType,
    // pinnedTasks: [] as PinnedTask[],
    // isLoadingPinnedTasks: false,
    // urgentCalendarEvent: null as CalendarEvent | null,
    // futureReminderEvent: null as CalendarEvent | null,
  }),
  // --- 3. 簡化點：移除不再需要的 getters ---
  getters: {
    // totalPinnedTasks: (state): number => { ... },
    // completedPinnedTasks: (state): number => { ... },
  },
  actions: {
    // --- (主題相關的 actions 保持不變) ---
    async initTheme() {
      const savedTheme = await window.ipcRenderer.invoke('get-theme') as Theme | null;
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        this.theme = savedTheme;
      }
      document.documentElement.setAttribute('data-theme', this.theme);
    },
    async toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', this.theme);
      await window.ipcRenderer.invoke('set-theme', this.theme);
    },

    // --- (側邊欄模式相關的 actions 保持不變) ---
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
    
    // --- 4. 簡化點：移除所有與儀表板、任務相關的 actions ---
    // setActivePersonalView(view: PersonalViewType) { ... },
    // async fetchPinnedTasks() { ... },
    // async fetchPinnedCalendarEvents() { ... }
  },
})

// 註解：useFileStore 維持不變，因為它的功能依然是新架構的核心。
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