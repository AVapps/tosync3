<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script>
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { defineComponent, watchEffect } from 'vue'
import { useMainStore } from '@/store'

export default defineComponent({
  name: 'App',
  components: {
    IonApp,
    IonRouterOutlet
  },
  setup() {
    const store = useMainStore()
    store.init()
    watchEffect(() => {
      switch (store.config.theme) {
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