<template>
  <div class="crewweb-widget">
    <loading-button
      v-if="!state.isLoggedIn"
      @click="openCrewWebPlus()"
      :loading="state.status === 'connecting' || loading"
      class="full-width"
      shape="round"
    >
      Connexion
    </loading-button>

    <template v-if="state.isLoggedIn">
      <ion-chip color="success">
        <ion-icon :icon="ellipse" size="small"></ion-icon>
        <ion-label>{{ state.userId }}</ion-label>
      </ion-chip>
      <ion-button @click="show()" fill="clear" shape="round" size="small">
        <ion-icon :icon="openOutline"></ion-icon>
        &nbsp; Afficher Crew Web Plus
      </ion-button>

      <template v-if="!mini && state.hasPendingChanges">
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

      <template v-if="!mini && state.needsRosterValidation">
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

      <template
        v-if="!mini && !state.needsRosterValidation && !state.hasPendingChanges"
      >
        <ion-chip color="success">
          <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
          <ion-label>Planning validé</ion-label>
        </ion-chip>
        <ion-button
          @click="importPDF()"
          class="full-width"
          fill="outline"
          shape="round"
          color="primary"
        >
          <ion-icon :icon="syncOutline"></ion-icon>
          &nbsp; Synchroniser
        </ion-button>
      </template>
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
  syncOutline,
  ellipse
} from 'ionicons/icons'
import { useMainStore } from '@/store'
import { useCrewWebPlus } from '@/lib/useCrewWebPlus'
import { importPdfFile } from '@/lib/PlanningImporter.js'

import { has } from 'lodash'
import { DateTime } from 'luxon'
import LoadingButton from './LoadingButton.vue'

export default defineComponent({
  name: 'ThemeSwitcher',
  props: {
    mini: {
      type: Boolean,
      default: false
    }
  },
  emits: ['login', 'logout'],
  components: {
    IonButton,
    IonChip,
    IonLabel,
    IonIcon,
    LoadingButton
  },
  setup(_, { emit }) {
    const store = useMainStore()
    const crewWeb = useCrewWebPlus()
    const loading = ref(false)
    window.crewWeb = crewWeb

    crewWeb.on('login', state => {
      console.log('login', state)
      emit('login', state)
    })
    crewWeb.on('logout', state => emit('logout', state))

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
        // authenticate user
        console.log(crewWeb.state.userId)
        if (crewWeb.state.userId) {
          await store.loginUserId(crewWeb.state.userId)
        }
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

    function toISOMonth(date) {
      return date
        .toISODate()
        .substring(0, 7)
        .split('-')
        .reverse()
        .join('-')
    }

    async function importPDF() {
      const now = DateTime.local()
      const months = [
        toISOMonth(now.minus({ month: 6 })),
        toISOMonth(now.minus({ month: 5 })),
        toISOMonth(now.minus({ month: 4 })),
        toISOMonth(now.minus({ month: 3 })),
        toISOMonth(now.minus({ month: 2 })),
        toISOMonth(now.minus({ month: 1 })),
        toISOMonth(now)
      ]
      console.log(months)

      for (const isomonth of months) {
        try {
          console.log(`Importation ${isomonth}`)
          const pdfData = await crewWeb.getPDFFile(isomonth)
          console.log({ data: pdfData })
          const p = await importPdfFile(pdfData)
          console.log(p)
        } catch (error) {
          console.log(error)
        }
      }

      const data = await crewWeb.getPDFFile()
      const planning = await importPdfFile(data)
      console.log(data.length, planning)
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
      openCrewWebPlus: () => openCrewWebPlus().catch(console.log),
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
      syncOutline,
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

  .full-width {
    grid-column-start: 1;
    grid-column-end: 3;
    justify-self: center;
  }
}
</style>
