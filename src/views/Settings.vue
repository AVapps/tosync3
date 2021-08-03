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

      <User />

      <ion-list>
        <ion-list-header>
          <ion-label>Affichage</ion-label>
        </ion-list-header>
        <ion-item>
          <ion-label>Thème</ion-label>
          <theme-switcher />
        </ion-item>
      </ion-list>

      <profile-settings />
    </ion-content>
  </ion-page>
</template>

<script>
import { defineComponent } from 'vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import User from '@/components/Settings/User.vue'
import ProfileSettings from '@/components/Settings/Profile.vue'

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

export default defineComponent({
  name: 'SettingsTab',
  components: {
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonContent,
    IonHeader,
    IonPage,
    IonToolbar,
    IonTitle,
    ProfileSettings,
    ThemeSwitcher,
    User
  }
})
</script>

<style lang="scss">
.settings-wrapper {
  display: flex;
  justify-content: center;
}
</style>