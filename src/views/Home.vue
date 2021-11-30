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
            <ion-card-title>Crew Web Plus</ion-card-title>
            <ion-card-subtitle
              >Connectez-vous à Crew Web Plus pour importer votre
              planning</ion-card-subtitle
            >
          </ion-card-header>
          <ion-card-content>
            <crew-web-widget />
          </ion-card-content>
        </ion-card>
        <ion-card>
          <ion-card-header>
            <ion-card-title>Importer un fichier</ion-card-title>
            <ion-card-subtitle
              >Planning téléchargé depuis planning.to.aero</ion-card-subtitle
            >
          </ion-card-header>
          <ion-card-content>
            <file-picker></file-picker>
          </ion-card-content>
        </ion-card>
        <ion-card>
          <ion-card-header>
            <ion-card-subtitle
              >Synchronisez votre planning avec vos agendas</ion-card-subtitle
            >
            <ion-card-title>Synchronisation Calendrier</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <calendar-sync-widget />
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
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
  IonCardTitle
} from '@ionic/vue'

import CrewWebWidget from '@/components/CrewWebWidget'
import CalendarSyncWidget from '@/components/CalendarSyncWidget'
import FilePicker from '@/components/FilePicker'

import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Home',
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    CalendarSyncWidget,
    CrewWebWidget,
    FilePicker
  },
  setup() {
    return {}
  }
})
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
