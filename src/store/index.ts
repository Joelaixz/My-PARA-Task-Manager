import { defineStore } from 'pinia'

// 主 Store，用於管理應用程式級別的狀態
export const useMainStore = defineStore('main', {
  state: () => ({
    // 未來可以存放如：當前主題、使用者設定等
  }),
  getters: {},
  actions: {},
})

// --- 新增：用於管理檔案狀態的 Store ---
// 目的：集中管理當前選中的檔案路徑，方便跨元件共享。
export const useFileStore = defineStore('file', {
  state: (): { selectedFilePath: string | null } => ({
    selectedFilePath: null,
  }),
  actions: {
    /**
     * 目的：設定當前選中的檔案路徑。
     * @param path - 被選中檔案的完整路徑，或傳入 null 來清除選中狀態。
     */
    selectFile(path: string | null) {
      this.selectedFilePath = path
    },
  },
})