<script setup lang="ts">
import { ref } from 'vue';

// --- 介面定義 ---
// 目的：為統計卡片的資料結構定義一個清晰的型別，有助於維護和擴充。
interface StatCard {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}

// --- 假資料 (Mock Data) ---
// 目的：提供靜態的內容，用於前端介面的原型開發。
// 說明：未來這些'value'將會是從資料庫動態查詢出來的結果。
const stats = ref<StatCard[]>([
  { icon: '✅', label: '今日待辦任務', value: 3, color: '#42b983' },
  { icon: '📝', label: '本週新增筆記', value: 8, color: '#559fff' },
  { icon: '🚀', label: '進行中專案', value: 2, color: '#f5a623' },
]);
</script>

<template>
  <div class="quick-stats-container">
    <div v-for="stat in stats" :key="stat.label" class="stat-card">
      <div class="stat-icon" :style="{ backgroundColor: stat.color }">
        <span>{{ stat.icon }}</span>
      </div>
      <div class="stat-content">
        <p class="stat-label">{{ stat.label }}</p>
        <p class="stat-value">{{ stat.value }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 目的：定義統計卡片容器的整體佈局 */
.quick-stats-container {
  display: grid;
  /* 使用 grid 佈局，讓卡片能自動適應可用空間。
    'repeat(auto-fit, minmax(200px, 1fr))' 是一個響應式設計的技巧：
    - auto-fit: 自動填充容器，盡可能在一行內容納更多項目。
    - minmax(200px, 1fr): 每個卡片的最小寬度是 200px，最大會平均分配剩餘空間(1fr)。
  */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem; /* 卡片之間的間距 */
  padding: 1.5rem 2rem; /* 容器的內邊距 */
}

/* 目的：定義單一統計卡片的樣式 */
.stat-card {
  display: flex;
  align-items: center;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.stat-card:hover {
  transform: translateY(-4px); /* 滑鼠懸停時輕微向上移動 */
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2); /* 增加陰影以提升立體感 */
}

/* 目的：定義圖示的樣式 */
.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%; /* 圓形背景 */
  margin-right: 1rem;
  font-size: 1.5rem; /* 調整 emoji 圖示的大小 */
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  margin: 0;
  font-size: 0.85rem; /* 14px */
  color: var(--text-secondary);
}

.stat-value {
  margin: 0.25rem 0 0;
  font-size: 1.75rem; /* 28px */
  font-weight: 600;
  color: var(--text-primary);
}
</style>