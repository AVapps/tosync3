<template>
  <div class="crewweb-widget">
    <ion-button v-if="!state.connected" @click="openCrewWebPlus()">
      Connexion
    </ion-button>

    <template v-if="state.connected">
      <ion-button fill="outline" @click="show()">
        <ion-icon :icon="eyeOutline"></ion-icon>
        &nbsp; Afficher Crew Web Plus
      </ion-button>
      <ion-button
        v-if="state.needsRosterValidation"
        @click="signRoster()"
        color="secondary"
      >
        <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
        &nbsp; Valider mon planning
      </ion-button>
    </template>
  </div>
</template>

<script>
import { defineComponent, reactive } from 'vue'
import { IonButton, IonIcon } from '@ionic/vue'
import { eyeOutline, checkmarkCircleOutline } from 'ionicons/icons'

import { useMainStore } from '@/store'
import { CrewWebPlus } from '@/lib/CrewWebPlus.js'
import { importPdfFile } from '@/lib/PlanningImporter.js'

export default defineComponent({
  name: 'ThemeSwitcher',
  components: {
    IonButton,
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
      state,
      show,
      hide,
      eyeOutline,
      checkmarkCircleOutline
    }
  }
})
</script>

<style lang="scss">
.crewweb-widget {
  display: grid;
  gap: 0.5rem;
  place-items: center center;
}
</style>

