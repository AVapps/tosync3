<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Réglages</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Réglages</ion-title>
        </ion-toolbar>
      </ion-header>
      <br />
      <div class="settings-wrapper">
        <theme-switcher />
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons
} from '@ionic/vue'

export default {
  name: 'Tab3',
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonButtons,
    ThemeSwitcher
  }
}
</script>

<style lang="scss">
.settings-wrapper {
  display: flex;
  justify-content: center;
}
</style>