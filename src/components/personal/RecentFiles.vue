<script setup lang="ts">
import { ref } from 'vue';

// --- 介面定義 ---
// 目的：為最近檔案的資料結構定義一個型別。
interface RecentFile {
  id: number;
  name: string;
  path: string; // 簡化的父層路徑，用於顯示
  type: 'md' | 'pdf' | 'png' | 'folder';
}

// --- 假資料 (Mock Data) ---
// 目的：提供一個包含不同檔案類型的靜態列表。
const recentFiles = ref<RecentFile[]>([
  { id: 1, name: '專案A-會議記錄.md', path: 'Projects/專案A', type: 'md' },
  { id: 2, name: '高效學習法.pdf', path: 'Resources/閱讀材料', type: 'pdf' },
  { id: 3, name: '系統架構圖.png', path: 'Projects/專案B/設計稿', type: 'png' },
  { id: 4, name: '領域C-核心概念', path: 'Areas/領域C', type: 'folder' },
  { id: 5, name: '年度目標規劃.md', path: 'Personal/2025年', type: 'md' },
]);

// --- 輔助函式 ---
// 目的：根據檔案類型回傳對應的 emoji 圖示，與 FileTree 元件保持一致。
function getIconForType(type: RecentFile['type']): string {
  switch (type) {
    case 'md': return '📝';
    case 'pdf': return '📕';
    case 'png': return '🖼️';
    case 'folder': return '📁';
    default: return '❔';
  }
}
</script>

<template>
  <div class="recent-files-widget">
    <div class="widget-header">
      <h3 class="widget-title">最近開啟</h3>
      <a href="#" class="view-all-link">查看全部</a>
    </div>
    <ul class="file-list">
      <li 
        v-for="file in recentFiles" 
        :key="file.id" 
        class="file-item"
      >
        <span class="file-icon">{{ getIconForType(file.type) }}</span>
        <div class="file-info">
          <span class="file-name">{{ file.name }}</span>
          <span class="file-path">{{ file.path }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* 目的：定義整個微件的容器樣式 */
.recent-files-widget {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
}

/* 目的：定義微件頂部標題和連結的佈局 */
.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.widget-title {
  margin: 0;
  font-size: 1.1rem; /* 18px */
  font-weight: 600;
  color: var(--text-primary);
}

.view-all-link {
  font-size: 0.8rem; /* 13px */
  color: var(--link-color);
  text-decoration: none;
  transition: text-decoration 0.2s;
}
.view-all-link:hover {
  text-decoration: underline;
}

/* 目的：定義檔案列表的樣式 */
.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* 目的：定義單一檔案項目的樣式 */
.file-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 0.25rem; /* 增加點擊區域 */
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}
.file-item:hover {
  background-color: var(--bg-tertiary);
}
.file-item:last-child {
  border-bottom: none;
}

.file-icon {
  font-size: 1.25rem;
  margin-right: 1rem;
  width: 24px; /* 固定寬度，讓排版更整齊 */
  text-align: center;
}

.file-info {
  display: flex;
  flex-direction: column;
  /* 避免檔名過長時溢出 */
  overflow: hidden; 
}

.file-name {
  color: var(--text-primary);
  font-size: 0.9rem; /* 14px */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /*檔名過長時顯示...*/
}

.file-path {
  color: var(--text-secondary);
  font-size: 0.75rem; /* 12px */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>