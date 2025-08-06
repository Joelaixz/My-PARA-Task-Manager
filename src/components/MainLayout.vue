<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="main-layout">
    <nav class="l1-sidebar">
      <RouterLink to="/" title="個人">1</RouterLink>
      <RouterLink to="/projects" title="專案">2</RouterLink>
      <RouterLink to="/areas" title="領域">3</RouterLink>
      <RouterLink to="/resources" title="資源">4</RouterLink>
      <RouterLink to="/archives" title="封存">5</RouterLink>
    </nav>

    <aside class="l2-sidebar">
      <div class="l2-header">檔案總管</div>
      <div class="file-list">
        <p>資料夾...</p>
        <p>檔案 1.md</p>
        <p>檔案 2.md</p>
      </div>
    </aside>

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
  overflow: hidden;
}

/* L1: 最左側圖示導航欄 */
.l1-sidebar {
  width: 60px;
  background-color: #2c3e50;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 1rem;
  flex-shrink: 0;
}

.l1-sidebar a {
  color: #bdc3c7;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background-color 0.3s, color 0.3s;
}

.l1-sidebar a:hover {
  background-color: #34495e;
  color: #ecf0f1;
}

.l1-sidebar a.router-link-exact-active {
  background-color: #42b983;
  color: white;
}


/* L2: 檔案列表側邊欄 */
.l2-sidebar {
  width: 240px;
  background-color: #ddd;
  border-right: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.l2-header {
  padding: 1rem;
  font-weight: bold;
  border-bottom: 1px solid #dcdfe6;
}

.file-list {
  padding: 1rem;
  overflow-y: auto;
  flex-grow: 1;
}

/* L3: 主內容區 */
.main-content {
  flex-grow: 1;
  background-color: #eee;
  overflow-y: auto;
}
</style>