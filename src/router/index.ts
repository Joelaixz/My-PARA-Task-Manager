import { createRouter, createWebHistory } from 'vue-router'
import PersonalView from '../views/PersonalView.vue'

const routes = [
  {
    path: '/',
    name: 'Personal',
    component: PersonalView,
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