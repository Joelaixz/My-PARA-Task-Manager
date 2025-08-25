import { createRouter, createWebHistory } from 'vue-router'
import PersonalView from '../views/PersonalView.vue'
import FileView from '../views/FileView.vue'

import DashboardHome from '../components/personal/DashboardHome.vue'

const routes = [
  {
    path: '/',
    name: 'Personal',
    component: PersonalView,
    children: [
      {
        path: '',
        name: 'DashboardHome',
        component: DashboardHome,
      },
      // --- 1. 新增「任務清單」的子路由 ---
      {
        path: 'tasks', // 當使用者訪問 /tasks 時
        name: 'TaskList',
        // 使用動態載入 (lazy-loading) 來提升效能
        component: () => import('../components/personal/TaskListView.vue')
      },
      // --- 2. 新增「未來日誌」的子路由 ---
      // 目的：為未來日誌頁面設定路由，路徑為 /future-log
      {
        path: 'future-log',
        name: 'FutureLog',
        component: () => import('../components/personal/FutureLogView.vue')
      }
    ]
  },
  {
    path: '/view',
    name: 'FileView',
    component: FileView,
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('../views/ProjectsView.vue'), // 懶加載
  },
  {
    path: '/areas',
    name: 'Areas',
    component: () => import('../views/AreasView.vue'), // 懶加載
  },
  {
    path: '/resources',
    name: 'Resources',
    component: () => import('../views/ResourcesView.vue'), // 懶加載
  },
  {
    path: '/archives',
    name: 'Archives',
    component: () => import('../views/ArchivesView.vue'), // 懶加載
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router