import { defineStore } from 'pinia'

// 主 Store，用於管理應用程式級別的狀態
export const useMainStore = defineStore('main', {
  state: () => ({
    // 未來可以存放如：當前主題、使用者設定等
  }),
  getters: {},
  actions: {},
})