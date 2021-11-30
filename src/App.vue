<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script>
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { defineComponent, watchEffect } from 'vue'
import { useMainStore } from '@/store'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'App',
  components: {
    IonApp,
    IonRouterOutlet
  },
  setup() {
    const store = useMainStore()
    const router = useRouter()

    store.init().then(() => {
      if (store.userId) {
        router.push('/tabs')
      }
    })

    watchEffect(() => {
      switch (store.config?.theme) {
        case 'light':
          document.body.classList.add('light')
          document.body.classList.remove('dark')
          break
        case 'dark':
          document.body.classList.add('dark')
          document.body.classList.remove('light')
          break
      }
    })
    return {}
  }
})
</script>
