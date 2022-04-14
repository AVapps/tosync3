<template>
  <ion-app>
    <loading-page v-if="!user.isReady" />
    <ion-router-outlet v-if="user.isReady && user.userId" />
    <welcome-page v-if="user.isReady && !user.userId" />
  </ion-app>
</template>

<script setup>
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import LoadingPage from '@/views/LoadingPage.vue'
import WelcomePage from './views/Welcome.vue'
import { watchEffect } from 'vue'
import { useMainStore, useUser, useCrews } from '@/store'
import { useRouter } from 'vue-router'

const store = useMainStore()
const user = useUser()
const crews = useCrews()
const router = useRouter()

window.user = user
window.store = store
window.crews = crews

watchEffect(() => {
  document.firstElementChild.setAttribute('data-theme', store.config.theme)
})
</script>
