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
      

      <ion-list>
        <ion-list-header>
          <ion-label>Affichage</ion-label>
        </ion-list-header>
        <ion-item>
          <ion-label>Thème</ion-label>
          <theme-switcher />
        </ion-item>
      </ion-list>

      <crew-connect-settings />
      <profile-settings />
      
    </ion-content>
  </ion-page>
</template>

<script setup>
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import UserSettings from '@/components/Settings/UserSettings.vue'
import ProfileSettings from '@/components/Settings/ProfileSettings.vue'
import CrewConnectSettings from '@/components/Settings/CrewConnectSettings.vue'

import {
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonTitle
} from '@ionic/vue'
</script>

<style lang="scss">
.settings-wrapper {
  display: flex;
  justify-content: center;
}
</style>