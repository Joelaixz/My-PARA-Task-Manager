<script setup lang="ts">
import { ref } from 'vue';

// --- 模擬資料與狀態 (Mock Data & State) ---
const isEditing = ref(false);
const activeList = ref('專案A發布檢查.md');

</script>

<template>
  <div class="task-list-page">
    <div v-if="isEditing" class="editor-view">
      <div class="list-tabs">
        <button class="tab-button" :class="{active: activeList === '本週採購清單.md'}" @click="activeList = '本週採購清單.md'">本週採購清單.md</button>
        <button class="tab-button" :class="{active: activeList === '專案A發布檢查.md'}" @click="activeList = '專案A發布檢查.md'">專案A發布檢查.md</button>
        <button class="tab-button">+</button>
        <button class="done-button" @click="isEditing = false">完成</button>
      </div>
      
      <div class="split-layout">
        <div class="preview-pane">
          <div class="task-table">
            <div class="task-table-header">
              <div class="header-cell task-name">任務</div>
              <div class="header-cell status">狀態</div>
              <div class="header-cell due-date">截止日期</div>
            </div>
            <div class="task-table-body">
              <div class="task-row is-parent is-expanded">
                <div class="task-cell task-name">
                  <span class="toggle-arrow">▼</span>
                  <span class="checkbox-icon">⬜️</span>
                  <span class="task-text">第一階段：準備工作</span>
                </div>
                <div class="task-cell status"><span class="status-tag in-progress">進行中</span></div>
                <div class="task-cell due-date">8月15日</div>
              </div>
              <div class="task-row is-child">
                <div class="task-cell task-name">
                  <span class="checkbox-icon">✅</span>
                  <span class="task-text">完成 API 文件撰寫</span>
                </div>
                <div class="task-cell status"><span class="status-tag done">已完成</span></div>
                <div class="task-cell due-date">8月12日</div>
              </div>
              <div class="task-row is-child">
                 <div class="task-cell task-name">
                  <span class="checkbox-icon">⬜️</span>
                  <span class="task-text">準備部署用的 Dockerfile</span>
                </div>
                <div class="task-cell status"></div>
                <div class="task-cell due-date">8月14日</div>
              </div>
               <div class="task-row is-parent">
                <div class="task-cell task-name">
                  <span class="toggle-arrow">▶</span>
                  <span class="checkbox-icon">⬜️</span>
                  <span class="task-text">第二階段：部署與測試</span>
                </div>
                <div class="task-cell status"><span class="status-tag">未開始</span></div>
                <div class="task-cell due-date">8月20日</div>
              </div>
            </div>
          </div>
        </div>
        <div class="editor-pane">
           <textarea class="markdown-input" readonly>
# 專案A發布檢查.md

- [ ] 第一階段：準備工作 `[狀態:進行中]` `[截止:8月15日]`
  - [x] 完成 API 文件撰寫 `[狀態:已完成]` `[截止:8月12日]`
  - [ ] 準備部署用的 Dockerfile `[截止:8月14日]`
- [ ] 第二階段：部署與測試 `[狀態:未開始]` `[截止:8月20日]`
  - [ ] 部署到 Staging 環境
  - [ ] 進行壓力測試
- [ ] 第三階段：上線
           </textarea>
        </div>
      </div>
    </div>

    <div v-else class="display-view">
      <button class="edit-button" @click="isEditing = true">編輯</button>
      <h1 class="display-title">專案A發布檢查</h1>
      <div class="task-table">
        <div class="task-table-header">
          <div class="header-cell task-name">任務</div>
          <div class="header-cell status">狀態</div>
          <div class="header-cell due-date">截止日期</div>
        </div>
        <div class="task-table-body">
          <div class="task-row is-parent is-expanded">
            <div class="task-cell task-name">
              <span class="toggle-arrow">▼</span>
              <span class="checkbox-icon">⬜️</span>
              <span class="task-text">第一階段：準備工作</span>
            </div>
            <div class="task-cell status"><span class="status-tag in-progress">進行中</span></div>
            <div class="task-cell due-date">8月15日</div>
          </div>
          <div class="task-row is-child">
            <div class="task-cell task-name">
              <span class="checkbox-icon">✅</span>
              <span class="task-text">完成 API 文件撰寫</span>
            </div>
            <div class="task-cell status"><span class="status-tag done">已完成</span></div>
            <div class="task-cell due-date">8月12日</div>
          </div>
          <div class="task-row is-child">
              <div class="task-cell task-name">
              <span class="checkbox-icon">⬜️</span>
              <span class="task-text">準備部署用的 Dockerfile</span>
            </div>
            <div class="task-cell status"></div>
            <div class="task-cell due-date">8月14日</div>
          </div>
          <div class="task-row is-parent">
            <div class="task-cell task-name">
              <span class="toggle-arrow">▶</span>
              <span class="checkbox-icon">⬜️</span>
              <span class="task-text">第二階段：部署與測試</span>
            </div>
            <div class="task-cell status"><span class="status-tag">未開始</span></div>
            <div class="task-cell due-date">8月20日</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- 1. 更新最外層容器為卡片樣式 --- */
.task-list-page {
  /* 外觀 */
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  
  /* 內部佈局 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 確保子元素的圓角被裁切 */
  padding-bottom: 30px;
}

/* --- 編輯模式 --- */
.editor-view { display: flex; flex-direction: column; height: 100%; }
.list-tabs { display: flex; align-items: center; background-color: var(--bg-primary); /* 讓分頁標籤有輕微的深度感 */ border-bottom: 1px solid var(--border-color); padding: 0 0.5rem; flex-shrink: 0; }
.tab-button { background: none; border: none; color: var(--text-secondary); padding: 0.75rem 1rem; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s ease; font-size: 0.85rem; }
.tab-button:hover { color: var(--text-primary); }
.tab-button.active { color: var(--color-personal); border-bottom-color: var(--color-personal); }
.done-button { margin-left: auto; background-color: var(--color-personal); color: var(--text-accent-contrast); border: none; border-radius: 4px; padding: 4px 12px; cursor: pointer; font-size: 0.85rem; }
.split-layout { display: flex; flex-grow: 1; overflow: hidden; }
.preview-pane, .editor-pane { width: 50%; height: 100%; overflow-y: auto; padding: 1rem 1.5rem; }
.preview-pane { border-right: 1px solid var(--border-color); }
.markdown-input { width: 100%; min-height: 250px; background: transparent; border: none; color: var(--text-secondary); font-family: monospace; font-size: 14px; line-height: 1.7; resize: none; }

/* --- 顯示模式 --- */
.display-view { position: relative; padding: 1.5rem 2rem; height: 100%; overflow-y: auto; }
.edit-button { position: absolute; top: 1.5rem; right: 2rem; z-index: 10; background-color: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; padding: 6px 12px; cursor: pointer; }
.edit-button:hover { background-color: var(--color-personal); color: var(--text-accent-contrast); }
.display-title { font-size: 1.75rem; font-weight: 600; margin: 0 0 2rem 0; }

/* --- 表格化巢狀清單樣式 (保持不變) --- */
.task-table { width: 100%; display: flex; flex-direction: column; }
.task-table-header, .task-row { display: flex; align-items: center; border-bottom: 1px solid var(--border-color); }
.task-table-header { color: var(--text-secondary); font-size: 0.8rem; font-weight: 600; text-transform: uppercase; padding: 0.75rem 0.5rem; }
.task-row:hover { background-color: var(--bg-tertiary); }
.header-cell, .task-cell { padding: 0.75rem 0.5rem; }
.task-cell.task-name { flex-grow: 1; display: flex; align-items: center; }
.header-cell.status, .task-cell.status { width: 120px; text-align: center; }
.header-cell.due-date, .task-cell.due-date { width: 150px; text-align: right; }
.toggle-arrow { width: 16px; height: 16px; margin-right: 8px; cursor: pointer; color: var(--text-secondary); font-size: 0.7rem; display: flex; align-items: center; justify-content: center; transition: transform 0.2s ease; }
.task-row.is-expanded > .task-cell > .toggle-arrow { transform: rotate(90deg); }
.checkbox-icon { margin-right: 0.75rem; font-size: 1rem; }
.task-row.is-child .task-cell.task-name { padding-left: 32px; }
.task-row.is-done .task-text { text-decoration: line-through; color: var(--text-secondary); }
.status-tag { font-size: 0.75rem; padding: 4px 8px; border-radius: 99px; font-weight: 500; background-color: var(--bg-tertiary); color: var(--text-secondary); }
.status-tag.in-progress { background-color: rgba(139, 177, 245, 0.2); color: var(--link-color); }
.status-tag.done { background-color: rgba(102, 187, 106, 0.2); color: var(--color-resources); }
</style>