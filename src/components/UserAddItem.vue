<template>
  <ion-card @click="signIn()" :button="true">
    <ion-avatar>
      <ion-icon :icon="addCircleOutline" />
    </ion-avatar>
    <ion-card-header>
      <ion-card-title class="ion-text-center">Connexion</ion-card-title>
    </ion-card-header>
  </ion-card>
</template>

<script setup>
import { useMainStore } from '@/store';
import { addCircleOutline } from 'ionicons/icons'
import { tryAndToastError } from '@/helpers/toast'
import { useIonRouter } from '@ionic/vue'

const store = useMainStore()
const router = useIonRouter()

async function signIn() {
  await tryAndToastError(() => store.signIn({ silent: false }))
  router.push('/')
}
</script>

<style lang="scss" scoped>
ion-card {
  --avatar-size: 100px;
  --card-width: 182px;
  width: var(--card-width);
  background: transparent;

  ion-avatar {
    display: block;
    margin: 10px auto 0;
    height: var(--avatar-size);
    width: var(--avatar-size);
  }

  ion-icon {
    display: block;
    font-size: var(--avatar-size);
    color: var(--ion-color-muted);
  }
}

</style>