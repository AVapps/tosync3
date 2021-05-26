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
            <ion-card-title>Télécharger mon planning</ion-card-title>
            <ion-card-subtitle></ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-button @click="openCrewWebPlus()">Connexion</ion-button>
            <ion-button @click="importPDF()">importPDF</ion-button>
            <ion-button @click="show()">show</ion-button>
            <ion-button @click="hide()">hide</ion-button>
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
            <ion-card-subtitle>Card Subtitle</ion-card-subtitle>
            <ion-card-title>Card Title</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            Keep close to Nature's heart... and break clear away, once in
            awhile, and climb a mountain or spend a week in the woods. Wash your
            spirit clean.
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
  IonButton
} from '@ionic/vue'
import FilePicker from '@/components/FilePicker'

import { defineComponent, ref } from 'vue'

import { CrewWebPlus } from '@/lib/CrewWebPlus.js'
import { importPdfFile } from '@/lib/PlanningImporter.js'

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
    IonButton,
    FilePicker
  },
  setup() {
    const event = ref({
      type: false,
      url: false
    })
    const crewWeb = new CrewWebPlus()
    window.crewWeb = crewWeb

    const openCrewWebPlus = async () => {
      console.log('Open Browser')
      crewWeb.open()
      await crewWeb.waitForLogin()
      crewWeb.browser.hide()
    }

    async function importPDF() {
      try {
        const data = await crewWeb.getPDFFile()
        const planning = await importPdfFile(data)
        console.log(data.length, planning)
      } catch (error) {
        console.log(error)
      }
    }

    function show() {
      crewWeb.show()
    }

    function hide() {
      crewWeb.hide()
    }

    return {
      openCrewWebPlus,
      importPDF,
      event,
      show,
      hide
    }
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