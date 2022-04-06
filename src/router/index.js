import { createRouter, createWebHistory } from '@ionic/vue-router'
import Tabs from '@/views/Tabs.vue'
import { useUserStore } from '@/store'

const routes = [
  {
    path: '/',
    beforeEnter: (to, from, next) => {
      const store = useUserStore()
      // if (!store.userId) {
      //   next('/welcome')
      // } else {
        next('/tabs')
      // }
    }
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
  },
  {
    path: '/welcome',
    component: () => import('@/views/Welcome.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
