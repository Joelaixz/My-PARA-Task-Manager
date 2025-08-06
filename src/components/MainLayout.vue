<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

// --- 檔案列表狀態 ---
const fileList = ref<string[]>([])
const isLoading = ref(false)

// --- 側邊欄狀態管理 ---
const isCollapsed = ref(false)
const sidebarWidth = ref(240) // 側邊欄初始寬度
const isResizing = ref(false)

// --- DOM 事件處理 ---
function startResize(event: MouseEvent) {
  event.preventDefault()
  isResizing.value = true
  window.addEventListener('mousemove', handleResizing)
  window.addEventListener('mouseup', stopResize)
}

function handleResizing(event: MouseEvent) {
  if (!isResizing.value) return
  // 60px 是 L1 側邊欄的寬度
  let newWidth = event.clientX - 60
  // 設定寬度上下限
  if (newWidth < 180) newWidth = 180
  if (newWidth > 500) newWidth = 500
  sidebarWidth.value = newWidth
}

function stopResize() {
  isResizing.value = false
  window.removeEventListener('mousemove', handleResizing)
  window.removeEventListener('mouseup', stopResize)
}

// 切換側邊欄的收合狀態
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

// 使用計算屬性來動態決定側邊欄的樣式
const sidebarStyle = computed(() => {
  if (isCollapsed.value) {
    return {
      width: '0px',
      padding: '0',
      borderRight: 'none', // 收合時隱藏邊框
      overflow: 'hidden'
    }
  }
  return {
    width: `${sidebarWidth.value}px`
  }
})


// --- IPC 通訊 ---
async function handleLoadFiles() {
  isLoading.value = true
  try {
    const files = await window.ipcRenderer.getFiles()
    fileList.value = files
  } catch (error) {
    console.error('Failed to get files from main process:', error)
    fileList.value = []
  } finally {
    isLoading.value = false
  }
}

// 元件銷毀時，確保移除事件監聽，避免記憶體洩漏
onUnmounted(() => {
  window.removeEventListener('mousemove', handleResizing)
  window.removeEventListener('mouseup', stopResize)
})
</script>

<template>
  <div class="main-layout" :class="{ 'is-resizing': isResizing }">
    <nav class="l1-sidebar">
      <RouterLink to="/" title="個人">01</RouterLink>
      <RouterLink to="/projects" title="專案">02</RouterLink>
      <RouterLink to="/areas" title="領域">03</RouterLink>
      <RouterLink to="/resources" title="資源">04</RouterLink>
      <RouterLink to="/archives" title="封存">05</RouterLink>
    </nav>
    
    <button v-if="isCollapsed" @click="toggleCollapse" class="expand-button">
      &gt;
    </button>

    <aside class="l2-sidebar" :style="sidebarStyle">
      <div v-if="!isCollapsed" class="sidebar-content">
        <div class="l2-header">
          <span>檔案總管</span>
          <div>
            <button @click="handleLoadFiles" :disabled="isLoading" title="選擇資料夾">📂</button>
            <button @click="toggleCollapse" title="收合側欄"> &lt; </button>
          </div>
        </div>
        <div class="file-list">
          <div v-if="fileList.length === 0" class="empty-list">
            點擊資料夾圖示選擇
          </div>
          <div v-else v-for="file in fileList" :key="file" class="file-item">
            {{ file }}
          </div>
        </div>
      </div>
    </aside>

    <div v-if="!isCollapsed" @mousedown="startResize" class="resizer"></div>

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
  background-color: #f0f2f5;
  overflow: hidden;
}

.main-layout.is-resizing {
  cursor: col-resize;
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
  z-index: 10;
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

/* 展開按鈕 */
.expand-button {
  position: absolute;
  left: 60px; /* 緊貼 L1 */
  top: 10px;
  z-index: 20;
  background: #34495e;
  color: white;
  border: none;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  cursor: pointer;
  padding: 8px 4px;
  font-family: monospace;
}
.expand-button:hover {
  background: #42b983;
}

/* L2: 檔案列表側邊欄 */
.l2-sidebar {
  background-color: #ffffff;
  border-right: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.l2-header {
  padding: 1rem;
  font-weight: bold;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.l2-header button {
  padding: 4px 8px;
  font-size: 12px;
  background-color: transparent;
  color: #606266;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 8px;
}

.l2-header button:hover {
  background-color: #f2f6fc;
}

.l2-header button:disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.file-list {
  padding: 1rem;
  overflow-y: auto;
  flex-grow: 1;
}

.empty-list, .file-item {
  padding: 0.5rem 0;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-list {
  color: #909399;
}

.file-item {
  cursor: pointer;
}

.file-item:hover {
  background-color: #ecf5ff;
}

/* 寬度調整拉桿 */
.resizer {
  width: 5px;
  cursor: col-resize;
  background-color: #f0f2f5;
  flex-shrink: 0;
  position: relative;
  z-index: 5;
}
.resizer:hover {
  background-color: #42b983;
}

/* L3: 主內容區 */
.main-content {
  flex-grow: 1;
  background-color: #fcfcfc;
  overflow-y: auto;
}
</style>