<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
// 1. 簡化點：不再需要 mainStore 來判斷顯示哪個元件
// import { useMainStore } from '../store'

// 2. 簡化點：只匯入 FileExplorer，移除所有其他的 Nav 元件
import FileExplorer from '../components/sidebar/FileExplorer.vue'

// 註解：容器本身的收合/展開/調整寬度邏輯保持不變
const isCollapsed = ref(false)
const sidebarWidth = ref(240)
const isResizing = ref(false)

function startResize(event: MouseEvent) {
  event.preventDefault()
  isResizing.value = true
  document.body.style.cursor = 'col-resize'
  window.addEventListener('mousemove', handleResizing)
  window.addEventListener('mouseup', stopResize)
}

function handleResizing(event: MouseEvent) {
  if (!isResizing.value) return
  const newWidth = event.clientX - 60
  if (newWidth >= 180 && newWidth <= 500) {
    sidebarWidth.value = newWidth
  }
}

function stopResize() {
  isResizing.value = false
  document.body.style.cursor = ''
  window.removeEventListener('mousemove', handleResizing)
  window.removeEventListener('mouseup', stopResize)
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

const sidebarStyle = computed(() => ({
  width: isCollapsed.value ? '0px' : `${sidebarWidth.value}px`,
  padding: isCollapsed.value ? '0' : undefined,
  borderRight: isCollapsed.value ? 'none' : undefined,
  overflow: 'hidden'
}))

onUnmounted(() => {
  window.removeEventListener('mousemove', handleResizing)
  window.removeEventListener('mouseup', stopResize)
})
</script>

<template>
  <div class="sidebar-view-wrapper" :class="{ 'is-resizing': isResizing }">
    <button v-if="isCollapsed" @click="toggleCollapse" class="expand-button">
      &gt;
    </button>

    <aside class="l2-sidebar" :style="sidebarStyle">
      <div v-if="!isCollapsed" class="sidebar-content">

        <FileExplorer @toggle-collapse="toggleCollapse" />

      </div>
    </aside>

    <div v-if="!isCollapsed" @mousedown="startResize" class="resizer"></div>
  </div>
</template>

<style scoped>
/* 樣式保持不變 */
.sidebar-view-wrapper {
  display: flex;
  height: 100%;
  position: relative;
}
.sidebar-view-wrapper.is-resizing {
  user-select: none;
}
.expand-button {
  position: absolute;
  left: 0;
  top: 40px;
  z-index: 20;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-left: none;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  cursor: pointer;
  padding: 8px 4px;
  font-family: monospace;
}
.expand-button:hover {
  background: var(--accent-color);
}
.l2-sidebar {
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
  height: 100%;
}
.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.resizer {
  width: 5px;
  cursor: col-resize;
  background-color: transparent;
  flex-shrink: 0;
  position: relative;
  z-index: 5;
  transition: background-color 0.2s;
}
.resizer:hover,
.sidebar-view-wrapper.is-resizing .resizer {
  background-color: var(--accent-color);
}
</style>