<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="Réglages" default-href="/tabs/settings" />
        </ion-buttons>
        <ion-title>Données personnelles</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Données personnelles</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-list>
        <ion-item button @click="confirmClearPlanningData()" :disabled="isLoading">
          <ion-spinner v-if="isLoading" slot="end" />
          <ion-label>Effacer les données de planning</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { alertController } from '@ionic/vue'
import { usePlanning } from '@/store'
import { tryAndToastError } from '@/helpers/toast'

const planning = usePlanning()
const isLoading = ref(false)

async function confirmClearPlanningData() {
  const alert = await alertController
    .create({
      header: 'Confirmez-vous la suppression des données de planning ?',
      translucent: true,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Confirmer',
          role: 'confirm',
          cssClass: 'danger-button'
        }
      ],
    })
  
  await alert.present()
  const { role } = await alert.onDidDismiss()
  console.log(role)
  if (role === 'confirm') {
    isLoading.value = true
    await tryAndToastError(() => planning.clearDb())
    isLoading.value = false
  }
}

</script>

<style lang="scss">
.alert-wrapper .danger-button {
  color: var(--ion-color-danger);
}
</style>