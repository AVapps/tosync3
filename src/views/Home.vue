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
          <ion-title size="large">Tab 1</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="cards-grid">
        <ion-card>
          <ion-card-header>
            <ion-card-subtitle>Card Subtitle</ion-card-subtitle>
            <ion-card-title>Card Title</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            Keep close to Nature's heart... and break clear away, once in awhile,
            and climb a mountain or spend a week in the woods. Wash your spirit clean.
            <ion-button @click="openCrewWebPlus()">CrewWebPlus</ion-button>
            <p>{{ event.type }}</p>
            <p>{{ event.url }}</p>
          </ion-card-content>
        </ion-card>
        <ion-card>
          <ion-card-header>
            <ion-card-subtitle>Card Subtitle</ion-card-subtitle>
            <ion-card-title>Card Title</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            Keep close to Nature's heart... and break clear away, once in awhile,
            and climb a mountain or spend a week in the woods. Wash your spirit clean.
          </ion-card-content>
        </ion-card>
        <ion-card>
          <ion-card-header>
            <ion-card-subtitle>Card Subtitle</ion-card-subtitle>
            <ion-card-title>Card Title</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            Keep close to Nature's heart... and break clear away, once in awhile,
            and climb a mountain or spend a week in the woods. Wash your spirit clean.
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
  IonCardTitle,
  IonButton } from '@ionic/vue'

import { defineComponent, ref } from 'vue'

import { CrewWebPlus } from '@/lib/CrewWebPlus.js'

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
    IonButton
  },
  setup() {
    const event = ref({
      type: false,
      url: false
    })
    const crewWeb = new CrewWebPlus()

    const openCrewWebPlus = () => {
      console.log('Open Browser')
      crewWeb.open()
      crewWeb.on('login', () => {
        console.log('HOME.VUE => on login handler')
        crewWeb.downloadPDFFile()
      })
    }

    return {
      openCrewWebPlus,
      event
    }
  }
})
</script>

<style scoped lang="scss">
.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 0px;

  @media only screen and (max-width : 576px) {
    grid-template-columns: 1fr;
  }
}
</style>