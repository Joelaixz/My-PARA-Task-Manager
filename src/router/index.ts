import { createRouter, createWebHistory } from 'vue-router'
import FileView from '../views/FileView.vue'

const routes = [
  {
    // 目的：將根路徑（個人模式）的元件指向 FileView
    path: '/',
    name: 'Personal',
    component: FileView,
    // 註解：移除了原有的 children 陣列，因為不再需要儀表板、任務清單等子視圖。
  },
  {
    // 目的：保留此獨立路由，因為 FileTree 元件目前使用它來強制刷新視圖。
    path: '/view',
    name: 'FileView',
    component: FileView,
  },
  {
    // 目的：將專案模式的元件指向 FileView
    path: '/projects',
    name: 'Projects',
    component: FileView,
  },
  {
    // 目的：將領域模式的元件指向 FileView
    path: '/areas',
    name: 'Areas',
    component: FileView,
  },
  {
    // 目的：將資源模式的元件指向 FileView
    path: '/resources',
    name: 'Resources',
    component: FileView,
  },
  {
    // 目的：將封存模式的元件指向 FileView
    path: '/archives',
    name: 'Archives',
    component: FileView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router