<template>
  <div class="crewweb-widget">
    <ion-button
      v-if="!state.connected"
      @click="openCrewWebPlus()"
      class="connect-button"
      shape="round"
    >
      Connexion
    </ion-button>

    <template v-if="state.connected">
      <ion-chip color="success">
        <ion-icon :icon="ellipse" size="small"></ion-icon>
        <ion-label>Connecté</ion-label>
      </ion-chip>
      <ion-button @click="show()" fill="clear" shape="round" size="small">
        <ion-icon :icon="openOutline"></ion-icon>
        &nbsp; Afficher Crew Web Plus
      </ion-button>

      <template v-if="state.hasPendingChanges">
        <ion-chip color="warning">
          <ion-icon :icon="alertCircleOutline"></ion-icon>
          <ion-label>Modification planning</ion-label>
        </ion-chip>
        <ion-button
          @click="signChanges()"
          fill="clear"
          shape="round"
          size="small"
          color="warning"
        >
          <ion-icon :icon="openOutline"></ion-icon>
          &nbsp; Valider les modifications
        </ion-button>
      </template>

      <template v-if="state.needsRosterValidation">
        <ion-chip color="warning">
          <ion-icon :icon="alertCircleOutline"></ion-icon>
          <ion-label>Planning à valider</ion-label>
        </ion-chip>
        <ion-button
          @click="signRoster()"
          fill="clear"
          shape="round"
          size="small"
          color="warning"
        >
          <ion-icon :icon="openOutline"></ion-icon>
          &nbsp; Valider mon planning
        </ion-button>
      </template>

      <ion-chip
        v-if="!state.needsRosterValidation && !state.hasPendingChanges"
        color="success"
      >
        <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
        <ion-label>Planning validé</ion-label>
      </ion-chip>
    </template>
  </div>
</template>

<script>
import { defineComponent, reactive } from 'vue'
import { IonButton, IonChip, IonLabel, IonIcon } from '@ionic/vue'
import {
  eyeOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  openOutline,
  ellipse
} from 'ionicons/icons'

import { useMainStore } from '@/store'
import { CrewWebPlus } from '@/lib/CrewWebPlus.js'
import { importPdfFile } from '@/lib/PlanningImporter.js'

export default defineComponent({
  name: 'ThemeSwitcher',
  components: {
    IonButton,
    IonChip,
    IonLabel,
    IonIcon
  },
  setup() {
    const store = useMainStore()
    const state = reactive({
      connected: false,
      hasPendingChanges: false,
      needsRosterValidation: false
    })

    const crewWeb = new CrewWebPlus()
    window.crewWeb = crewWeb

    const openCrewWebPlus = async () => {
      console.log('Open Browser')
      try {
        crewWeb.open()
        await crewWeb.waitForLogin()
        crewWeb.browser.hide()
        const newState = await crewWeb.getUserState()
        Object.assign(state, newState)
      } catch (err) {
        console.log(err)
      }
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

    async function signRoster() {
      try {
        const newState = await crewWeb.signRoster()
        Object.assign(state, newState)
      } catch (err) {
        console.log(err)
        return
      }

      if (
        state.connected &&
        !state.needsRosterValidation &&
        !state.hasPendingChanges
      ) {
        importPDF()
      }
    }

    async function signChanges() {
      try {
        const newState = await crewWeb.signRoster()
        Object.assign(state, newState)
      } catch (err) {
        console.log(err)
        return
      }

      if (
        state.connected &&
        !state.needsRosterValidation &&
        !state.hasPendingChanges
      ) {
        importPDF()
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
      signRoster,
      signChanges,
      state,
      show,
      hide,
      eyeOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      openOutline,
      ellipse
    }
  }
})
</script>

<style lang="scss">
.crewweb-widget {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem;
  place-items: center start;

  .connect-button {
    grid-column-start: 1;
    grid-column-end: 3;
    justify-self: center;
  }
}
</style>
