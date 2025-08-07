<script setup lang="ts">
import { ref, computed } from 'vue'

// --- Props ---
const props = defineProps<{
  content: {
    base64: string;
    mimeType: string;
  }
}>()

// --- Refs ---
const scale = ref(1)
const imageRef = ref<HTMLImageElement | null>(null)
const imageWidth = ref(0)
const imageHeight = ref(0)

// --- Computed ---
// 保持不變：計算 CSS transform 樣式
const imageStyle = computed(() => ({
  transform: `scale(${scale.value})`
}))

// 1. 修改：只回傳單一的、格式化的當前尺寸字串
const currentDimensions = computed(() => {
  if (imageWidth.value > 0) {
    const scaledW = Math.round(imageWidth.value * scale.value);
    const scaledH = Math.round(imageHeight.value * scale.value);
    return `${scaledW} x ${scaledH}`;
  }
  return '讀取中...'; // 提供一個載入中的預設文字
})

// --- Functions ---
function zoomIn() {
  scale.value = parseFloat((scale.value + 0.1).toFixed(2));
}

function zoomOut() {
  if (scale.value > 0.2) {
    scale.value = parseFloat((scale.value - 0.1).toFixed(2));
  }
}

function onImageLoad() {
  if (imageRef.value) {
    imageWidth.value = imageRef.value.naturalWidth;
    imageHeight.value = imageRef.value.naturalHeight;
  }
}
</script>

<template>
  <div class="component-wrapper">
    <div class="image-scroll-container">
      <img 
        ref="imageRef"
        :src="`data:${props.content.mimeType};base64,${props.content.base64}`" 
        alt="Image Preview" 
        class="preview-image"
        :style="imageStyle"
        @load="onImageLoad"
      />
    </div>

    <div class="zoom-controls">
      <div class="dimension-display">
        {{ currentDimensions }}
      </div>
      <div class="controls-row">
        <button @click="zoomOut" title="縮小">-</button>
        <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
        <button @click="zoomIn" title="放大">+</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 4. 新增：外層 wrapper 的樣式 */
.component-wrapper {
  position: relative; /* 成為絕對定位元素的基準 */
  width: 100%;
  height: 100%;
  overflow: hidden; /* 隱藏所有超出此元件的部分 */
}

/* 5. 修改：滾動容器的樣式 */
.image-scroll-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 2rem;
  box-sizing: border-box;
  overflow: auto; /* 允許在圖片放大後進行滾動 */
}

.preview-image {
  /* 移除 max-width/height，因為滾動容器會處理邊界 */
  object-fit: contain;
  transition: transform 0.15s ease-out;
  /* 關鍵：確保圖片在縮小後不會被父容器的 flex 屬性壓縮 */
  flex-shrink: 0; 
}

/* 6. 修改：控制項使用絕對定位，固定在右下角 */
.zoom-controls {
  position: fixed;
  bottom: 20px;
  right: 30px;
  
  background-color: rgba(45, 45, 45, 0.8);
  backdrop-filter: blur(5px);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  z-index: 100;
  user-select: none;
}

.dimension-display {
  color: var(--text-secondary);
  font-size: 12px;
  margin-bottom: 6px;
  padding: 4px 6px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  text-align: center; /* 確保文字本身置中 */
}

.controls-row {
  display: flex;
  align-items: center;
}

.zoom-controls button {
  background-color: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  width: 36px;
  height: 36px;
  line-height: 36px;
  text-align: center;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.zoom-controls button:hover {
  background-color: var(--bg-tertiary);
}

.zoom-level {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  padding: 0 12px;
  min-width: 50px;
  text-align: center;
}
</style>