<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import SidebarView from './SidebarView.vue'
import { useMainStore, type SidebarMode } from '../store';

const mainStore = useMainStore();
const route = useRoute();

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

/* --- 1. 修正 CSS 選擇器 --- */
/* 從 .router-link-exact-active 改為 .router-link-active */
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