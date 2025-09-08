<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import SidebarView from './SidebarView.vue'
import { useMainStore, type SidebarMode } from '../store';

const mainStore = useMainStore();
const route = useRoute();

onMounted(() => {
  mainStore.initTheme();
});

/**
 * 目的：根據路由的頂層路由名稱，決定側邊欄應該處於何種模式。
 */
function updateSidebarMode() {
  // 1. 修改點：如果目標路由是 FileView，則不改變當前的 sidebarMode。
  // 為什麼：當使用者在同一個模式下點擊不同檔案時，我們希望側邊欄的狀態（模式）保持不變，
  //         而不是因為路由跳轉到 /view 而被重置。
  const topLevelRouteName = route.matched[0]?.name;
  if (topLevelRouteName === 'FileView') {
    return;
  }

  let mode: SidebarMode = 'files'; // 預設值

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
    // 註解：如果找不到對應的模式，它會使用預設值 'files'，
    // 但在我們簡化後的路由中，這種情況不應該發生。
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
      <button
        @click="mainStore.toggleTheme"
        class="theme-toggle-button button-reset interactive-item rounded-md"
        :title="`切換至${mainStore.theme === 'dark' ? '明亮' : '暗黑'}模式`"
      >
        <span v-if="mainStore.theme === 'dark'">🌙</span>
        <span v-else>☀️</span>
      </button>

      <RouterLink to="/" title="個人" class="interactive-item rounded-md">🏠</RouterLink>
      <RouterLink to="/projects" title="專案" class="interactive-item rounded-md">🚀</RouterLink>
      <RouterLink to="/areas" title="領域" class="interactive-item rounded-md">📚</RouterLink>
      <RouterLink to="/resources" title="資源" class="interactive-item rounded-md">📦</RouterLink>
      <RouterLink to="/archives" title="封存" class="interactive-item rounded-md">🔐</RouterLink>
    </nav>
    
    <SidebarView />

    <main class="main-content">
      <RouterView :key="route.fullPath" />
    </main>
  </div>
</template>

<style scoped>
/* 樣式保持不變 */
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

.theme-toggle-button {
  color: var(--text-secondary);
  font-size: 1.5rem;
  padding: 0.5rem;
  margin-bottom: 1.5rem;
  line-height: 1;
  border: 1px solid transparent;
}
.theme-toggle-button:hover {
  border-color: var(--border-color);
}


.l1-sidebar a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
}

.l1-sidebar a.router-link-active {
  background-color: var(--accent-color);
  color: var(--text-accent-contrast);
}
.l1-sidebar a.router-link-active:hover {
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