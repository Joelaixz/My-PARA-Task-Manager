<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
// --- 1. 新增點：匯入 watch 和 onMounted ---
import { watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import SidebarView from './SidebarView.vue'
import { useMainStore, type SidebarMode } from '../store';

const mainStore = useMainStore();
const route = useRoute();

// --- 2. 新增點：在元件掛載時初始化主題 ---
// 目的：確保應用程式啟動時，能從後端讀取並應用使用者儲存的主題設定。
onMounted(() => {
  mainStore.initTheme();
});


/**
 * 目的：根據路由的頂層路由名稱，決定側邊欄應該處於何種模式。
 */
function updateSidebarMode() {
  const topLevelRouteName = route.matched[0]?.name;
  let mode: SidebarMode = 'files';

  switch(topLevelRouteName) {
    case 'Personal':
      mode = 'personal';
      break;
    case 'Projects':
      mode = 'projects';
      break;
    case 'Areas':
      mode = 'areas';
      break;
    case 'Resources':
      mode = 'resources';
      break;
    case 'Archives':
      mode = 'archives';
      break;
    default:
      mode = 'files';
  }
  
  mainStore.setSidebarMode(mode);
}

// 監聽路由變化，即時更新側邊欄模式
watch(() => route.name, () => {
  updateSidebarMode();
}, { immediate: true });

</script>

<template>
  <div class="main-layout">
    <nav class="l1-sidebar">
      <button @click="mainStore.toggleTheme" class="theme-toggle-button" :title="`切換至${mainStore.theme === 'dark' ? '明亮' : '暗黑'}模式`">
        <span v-if="mainStore.theme === 'dark'">🌙</span>
        <span v-else>☀️</span>
      </button>

      <RouterLink to="/" title="個人">🏠</RouterLink>
      <RouterLink to="/projects" title="專案">🚀</RouterLink>
      <RouterLink to="/areas" title="領域">📚</RouterLink>
      <RouterLink to="/resources" title="資源">📦</RouterLink>
      <RouterLink to="/archives" title="封存">🔐</RouterLink>
    </nav>
    
    <SidebarView />

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-primary);
  overflow: hidden;
}

.l1-sidebar {
  width: 60px;
  background-color: var(--bg-l1-sidebar);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 1rem;
  flex-shrink: 0;
  z-index: 10;
  border-right: 1px solid var(--border-color);
}

/* --- 4. 新增點：主題切換按鈕的樣式 --- */
.theme-toggle-button {
  background: none;
  border: 1px solid transparent; /* 預留邊框空間，避免 hover 時跳動 */
  color: var(--text-secondary);
  font-size: 1.5rem;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 1.5rem; /* 與下方導航按鈕間距一致 */
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
  line-height: 1; /* 確保 icon 垂直置中 */
}

.theme-toggle-button:hover {
  background-color: var(--bg-tertiary);
  border-color: var(--border-color);
  color: var(--text-primary);
}


.l1-sidebar a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background-color 0.3s, color 0.3s;
}

.l1-sidebar a:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

/* 修正 CSS 選擇器 */
.l1-sidebar a.router-link-active {
  background-color: var(--accent-color);
  color: var(--text-accent-contrast);
}

.main-content {
  flex-grow: 1;
  background-color: var(--bg-primary);
  display: flex;
  flex-direction: column;
}
</style>