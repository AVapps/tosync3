import { createRouter, createWebHistory } from '@ionic/vue-router'
import { until } from '@vueuse/core'
import { useMainStore, useUser } from '@/store'
import TabsPage from '@/views/TabsPage.vue'

const routes = [
  {
    path: '/',
    name: 'root',
    redirect: '/tabs/home'
  },
  {
    path: '/tabs/',
    name: 'tabs',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/home'
      },
      {
        path: 'home',
        name: 'home',
        component: () => import('@/views/HomePage.vue')
      },
      {
        path: 'planning',
        name: 'planning',
        component: () => import('@/views/PlanningPage.vue')
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/SettingsPage.vue')
      }
    ]
  },
  {
    path: '/welcome',
    name: 'welcome',
    component: () => import('@/views/WelcomePage.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/UserSelectPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach(async (to) => {
  if (to.path === '/welcome' || to.path === '/login') {
    return
  }

  const main = useMainStore()
  await until(() => main.isReady).toBe(true)
  if (main.firstUse) {
    return '/welcome'
  }

  const user = useUser()
  await until(() => user.isReady).toBe(true)
  if (!user.userId) {
    return '/login'
  }
  
})

export default router
