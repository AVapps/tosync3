<template>
  <div class="crewweb-widget">
    <loading-button
      v-if="!state.isLoggedIn"
      @click="openCrewWebPlus()"
      :loading="state.status === 'connecting' || loading"
      class="connect-button"
      shape="round"
    >
      Connexion
    </loading-button>

    <template v-if="state.isLoggedIn">
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
import { defineComponent, ref, watchEffect } from 'vue'
import {
  IonButton,
  IonChip,
  IonLabel,
  IonIcon,
  alertController,
  toastController
} from '@ionic/vue'
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

import { has } from 'lodash'
import LoadingButton from './LoadingButton.vue'

export default defineComponent({
  name: 'ThemeSwitcher',
  components: {
    IonButton,
    IonChip,
    IonLabel,
    IonIcon,
    LoadingButton
  },
  setup() {
    const store = useMainStore()
    const crewWeb = new CrewWebPlus()
    const loading = ref(false)
    window.crewWeb = crewWeb

    watchEffect(() =>
      crewWeb.storeCredentials(store.config?.useSavedCredentials)
    )

    const openCrewWebPlus = async () => {
      console.log('Open Browser')
      loading.value = true
      try {
        if (store.config?.useSavedCredentials) {
          await crewWeb.loadCredentials()
        }
        crewWeb.open()
        await crewWeb.waitForLogin()
        crewWeb.browser.hide()
        loading.value = false

        if (!has(store.config, 'useSavedCredentials')) {
          const alert = await alertController.create({
            header: 'Mémoriser mes identifiants ?',
            message:
              'Souhaitez-vous enregistrer vos identifiants CrewWebPlus dans votre trousseau afin de vous connecter plus rapidement ?',
            buttons: [
              {
                text: 'Oui',
                handler: async () => {
                  try {
                    await crewWeb.saveCredentials()
                    store.config.useSavedCredentials = true
                    const toast = await toastController.create({
                      color: 'success',
                      message: 'Identifiants enregistrés !',
                      duration: 2000
                    })
                    toast.present()
                  } catch (err) {
                    const toast = await toastController.create({
                      color: 'danger',
                      message: "L'enregistrement a échoué !",
                      duration: 2000
                    })
                    toast.present()
                  }
                }
              },
              {
                text: 'Non',
                handler: () => {
                  store.config.useSavedCredentials = false
                }
              }
            ]
          })
          alert.present()
        }
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
        await crewWeb.signRoster()
      } catch (err) {
        console.log(err)
        return
      }

      if (
        crewWeb.state.isLoggedIn &&
        !crewWeb.state.needsRosterValidation &&
        !crewWeb.state.hasPendingChanges
      ) {
        importPDF()
      }
    }

    async function signChanges() {
      try {
        await crewWeb.signChanges()
      } catch (err) {
        console.log(err)
        return
      }

      if (
        crewWeb.state.isLoggedIn &&
        !crewWeb.state.needsRosterValidation &&
        !crewWeb.state.hasPendingChanges
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
      state: crewWeb.state,
      loading,
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
