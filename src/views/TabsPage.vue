<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/tabs/home">
          <ion-icon :icon="homeOutline"></ion-icon>
        </ion-tab-button>

        <ion-tab-button tab="planning" href="/tabs/planning">
          <ion-icon :icon="calendarOutline" />
        </ion-tab-button>

        <ion-tab-button tab="crews" href="/tabs/crews">
          <ion-icon :icon="peopleOutline" />
        </ion-tab-button>

        <ion-tab-button tab="settings" href="/tabs/settings">
          <ion-icon :icon="cogOutline" />
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
import { IonTabBar, IonTabButton, IonTabs, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue'
import { homeOutline, calendarOutline, cogOutline, peopleOutline } from 'ionicons/icons'
</script>
