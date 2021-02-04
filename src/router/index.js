import { createRouter, createWebHistory } from '@ionic/vue-router';
import Tabs from '@/views/Tabs.vue'

const routes = [
  {
    path: '/',
    redirect: '/tabs'
  },
  {
    path: '/tabs/',
    component: Tabs,
    children: [
      {
        path: '',
        redirect: '/tabs/home'
      },
      {
        path: 'home',
        component: () => import('@/views/Home.vue')
      },
      {
        path: 'planning',
        component: () => import('@/views/Planning.vue')
      },
      {
        path: 'settings',
        component: () => import('@/views/Settings.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
