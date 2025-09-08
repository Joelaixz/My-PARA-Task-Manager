<script setup lang="ts">
// 目的：定義元件的 Props
// show: 控制選單是否顯示
// x, y: 控制選單顯示的座標
defineProps<{
  show: boolean;
  x: number;
  y: number;
}>();

// 目的：定義元件可以發出的事件
// @rename: 當點擊「重新命名」時發出
// @delete: 當點擊「刪除」時發出
const emit = defineEmits(['rename', 'delete']);

function handleRename() {
  emit('rename');
}

function handleDelete() {
  emit('delete');
}
</script>

<template>
  <Transition name="fade">
    <div 
      v-if="show"
      class="context-menu"
      :style="{ top: `${y}px`, left: `${x}px` }"
    >
      <ul class="menu-list">
        <li class="menu-item" @click="handleRename">重新命名</li>
        <li class="menu-item danger" @click="handleDelete">刪除</li>
      </ul>
    </div>
  </Transition>
</template>

<style scoped>
.context-menu {
  position: fixed; /* 使用 fixed 定位，確保相對於視窗定位 */
  z-index: 1000;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 4px;
  min-width: 150px;
}

.menu-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  color: var(--text-primary);
  transition: background-color 0.2s, color 0.2s;
}

.menu-item:hover {
  background-color: var(--accent-color);
  color: var(--text-accent-contrast);
}

.menu-item.danger:hover {
  background-color: #ef4444; /* 紅色，表示危險操作 */
  color: #ffffff;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>