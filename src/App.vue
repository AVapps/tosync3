<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script>
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { defineComponent, watchEffect } from 'vue'
import { useMainStore, useUserStore } from '@/store'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'App',
  components: {
    IonApp,
    IonRouterOutlet
  },
  setup() {
    const store = useMainStore()
    const userStore = useUserStore()
    const router = useRouter()

    userStore.init().then(
      () => {
        if (userStore.userId) {
          router.push('/tabs')
        }
      },
      err => {
        console.log(err)
      }
    )

    watchEffect(() => {
      watchEffect(() => {
        switch (userStore.config?.theme) {
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
    })
    
    return {}
  }
})
</script>
