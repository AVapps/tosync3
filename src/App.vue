<script setup>
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { watchEffect } from 'vue'
import { useMainStore, useUser, useCrews, useConnect } from '@/store'

const store = useMainStore()
const user = useUser()
const crews = useCrews()
const connect = useConnect()

window.user = user
window.store = store
window.crews = crews
window.connect = connect

watchEffect(() => {
  document.firstElementChild.setAttribute('data-theme', store.config.theme)
})
</script>

<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>
