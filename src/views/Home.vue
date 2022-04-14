<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title class="ion-text-center">TO.sync</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Accueil</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="cards-grid">
        <ion-card>
          <ion-card-header>
            <ion-card-title>CrewConnect</ion-card-title>
            <ion-card-subtitle></ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <crew-connect-widget />
          </ion-card-content>
        </ion-card>
        <ion-card v-if="isHybrid">
          <ion-card-header>
            <ion-card-subtitle
              >Synchronisez votre planning avec vos agendas</ion-card-subtitle
            >
            <ion-card-title>Synchronisation Calendrier</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <calendar-sync-widget></calendar-sync-widget>
          </ion-card-content>
        </ion-card>
        <!--
        <ion-card>
          <ion-card-header>
            <ion-card-subtitle></ion-card-subtitle>
            <ion-card-title>Exportation iCalendar</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <i-calendar-export-widget></i-calendar-export-widget>
          </ion-card-content>
        </ion-card> -->
      </div>

      <p style="text-align: center">{{ platforms }}</p>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardSubtitle,
  IonCardTitle,
  isPlatform,
  getPlatforms
} from '@ionic/vue'

import CrewConnectWidget from '@/components/CrewConnectWidget.vue'
import CalendarSyncWidget from '@/components/CalendarSyncWidget'
// import ICalendarExportWidget from '@/components/ICalendarExportWidget'

import { defineComponent } from 'vue'

const isHybrid = isPlatform('hybrid')
console.log(getPlatforms())
const platforms = getPlatforms().join(' ')
</script>

<style scoped lang="scss">
.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 0px;

  @media only screen and (max-width: 576px) {
    grid-template-columns: 1fr;
  }
}
</style>
