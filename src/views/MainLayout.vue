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
      <!-- 1. 修改點：整合 .button-reset 與 .interactive-item 等通用 class -->
      <button
        @click="mainStore.toggleTheme"
        class="theme-toggle-button button-reset interactive-item rounded-md"
        :title="`切換至${mainStore.theme === 'dark' ? '明亮' : '暗黑'}模式`"
      >
        <span v-if="mainStore.theme === 'dark'">🌙</span>
        <span v-else>☀️</span>
      </button>

      <!-- 2. 修改點：為所有 RouterLink 添加 .interactive-item class -->
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
  /* 使用 .flex-col 的概念，但因為有其他屬性，直接寫在這裡 */
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 1rem;
  flex-shrink: 0;
  z-index: 10;
  border-right: 1px solid var(--border-color);
}

/* 3. 簡化點：通用樣式已由 .button-reset 和 .interactive-item 取代 */
.theme-toggle-button {
  color: var(--text-secondary);
  font-size: 1.5rem;
  padding: 0.5rem;
  margin-bottom: 1.5rem;
  line-height: 1;
  /* 增加一個透明邊框，避免 hover 時佈局跳動 */
  border: 1px solid transparent;
}
/* hover 效果由 .interactive-item 提供，但邊框顏色需額外處理 */
.theme-toggle-button:hover {
  border-color: var(--border-color);
}


/* 4. 簡化點：通用樣式已由 .interactive-item 取代 */
.l1-sidebar a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
}

/* .interactive-item:hover 已處理了 hover 的背景色和文字顏色 */

.l1-sidebar a.router-link-active {
  background-color: var(--accent-color);
  color: var(--text-accent-contrast);
}
/* 當 active 時，覆蓋 hover 效果 */
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