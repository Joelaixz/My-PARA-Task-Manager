import { createRouter, createWebHistory } from 'vue-router'
import PersonalView from '../views/PersonalView.vue'
import FileView from '../views/FileView.vue'

// --- 1. 匯入我們為子路由建立的預設元件 ---
import DashboardHome from '../components/personal/DashboardHome.vue'

const routes = [
  {
    path: '/',
    name: 'Personal',
    component: PersonalView,
    // --- 2. 新增 children 屬性以定義子路由 ---
    // 目的：讓 PersonalView 內部可以透過 <RouterView /> 來渲染不同的內容面板。
    children: [
      {
        path: '', // 當父路徑為 / 時，預設載入此子路由
        name: 'DashboardHome',
        component: DashboardHome,
      },
      // 之後可以擴充其他子路由，例如：
      // {
      //   path: 'tasks',
      //   name: 'Tasks',
      //   component: () => import('../components/personal/TodoList.vue')
      // }
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