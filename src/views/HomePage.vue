<template>
  <ion-page>
    <ion-content class="home-content" :fullscreen="true">
      <ion-refresher
        slot="fixed"
        @ionRefresh="onRefresh($event)"
        :disabled="!connect.isConnected">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      <div class="cards-grid">
        <div class="card">
          <crew-connect-widget key="main"/>
          <unsigned-activities-widget key="unsigned-activities" />
          <roster-changes-widget key="roster-changes" />
        </div>
        
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
import CalendarSyncWidget from '@/components/CalendarSyncWidget.vue'
// import ICalendarExportWidget from '@/components/ICalendarExportWidget'
import RosterChangesWidget from '@/components/RosterChangesWidget.vue'
import { useConnect, useMainStore } from '@/store'
import { toastError } from '@/helpers/toast'

const isHybrid = isPlatform('hybrid')
console.log('PLATFORMS',getPlatforms())
const platforms = getPlatforms().join(' ')

const store = useMainStore()
const connect = useConnect()

async function onRefresh(event) {
  try {
    await store.signIn({ silent: true })
  } catch (error) {
    toastError(error)
  } finally {
    event.target.complete()
  }
}

</script>

<style scoped lang="scss">
.home-content {
  --padding-top: 20px;
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 0px;

  @media only screen and (max-width: 576px) {
    grid-template-columns: 1fr;
  }
}
ion-refresher {
  top: 20px;
}
</style>
