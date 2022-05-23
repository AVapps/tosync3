<template>
  <ion-card @click="signIn()" :button="true" :disabled="connect.isLoading">
    <ion-avatar>
      <ion-icon :icon="addCircleOutline" />
    </ion-avatar>
    <ion-spinner class="loading-spinner" :class="connect.isLoading ? 'show' : ''" name="crescent" />
    <ion-card-header>
      <ion-card-title class="ion-text-center">
        Connexion
        <ion-spinner v-if="connect.isLoading" />
      </ion-card-title>
    </ion-card-header>
  </ion-card>
</template>

<script setup>
import { useConnect, useMainStore, useUser } from '@/store'
import { addCircleOutline } from 'ionicons/icons'
import { useIonRouter } from '@ionic/vue'

const mainStore = useMainStore()
const connect = useConnect()
const user = useUser()
const router = useIonRouter()

async function signIn() {
  await mainStore.signIn({ silent: false })
  if (user.userId) {
    router.push('/')
  }
}
</script>

<style lang="scss" scoped>
ion-card {
  --avatar-size: 120px;
  --card-width: 200px;

  background: transparent;
  box-shadow: none;

  &::part(native) {
    display: grid;
    grid-template: var(--avatar-size) auto / var(--card-width);
  }

  ion-avatar, ion-spinner.loading-spinner {
    grid-area: 1 / 1 / 2 / 2;
    display: block;
    margin: 10px auto 0;
    height: var(--avatar-size);
    width: var(--avatar-size);
  }

  ion-spinner.loading-spinner {
    background: rgba(255,255,255,0.5);
    backdrop-filter: blur(3px);
    opacity: 0;
    transition: opacity 0.5s ease;

    [data-theme=dark] & {
      background: rgba(0,0,0,0.5);
    }

    &.show {
      opacity: 1;
    }
  }

  ion-icon {
    display: block;
    font-size: var(--avatar-size);
  }

  ion-card-header {
    grid-area: 2 / 1 / 3 / 2;
  }
}
</style>