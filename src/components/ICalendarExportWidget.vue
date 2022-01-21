<template>
  <div class="icalendar-export-widget">
    <ion-list>
      <ion-item>
        <ion-label>Catégories</ion-label>
        <ion-select
          v-model="store.config.icalendarOptions.tags"
          cancel-text="Annuler"
          ok-text="Valider"
          multiple="true"
          placeholder="Catégories d'évènements à inclure"
          slod="end"
          :interface-options="{
            header: `Sélectionnez les catégories d'évènements à inclure`,
          }"
        >
          <ion-select-option
            v-for="tag in syncCategories"
            :key="tag"
            :value="tag"
          >
            {{ tag }}
          </ion-select-option>
        </ion-select>
      </ion-item>
    </ion-list>

    <loading-button :loading="loading" @click="exportEvents()">
      Exportation ICS
    </loading-button>
  </div>
</template>

<script>
import { defineComponent, ref, toRaw } from 'vue'
import {
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  toastController
} from '@ionic/vue'
import LoadingButton from './LoadingButton.vue'

import { useMainStore } from '@/store'
import { SYNC_CATEGORIES, exportIcs } from '@/lib/Export.js'
import { minSyncDate, maxSyncDate } from '@/lib/CalendarSync'

export default defineComponent({
  name: 'ICalendarExportWidget',
  components: {
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    LoadingButton
  },
  setup() {
    const store = useMainStore()
    const loading = ref(false)
    const syncCategories = Object.keys(SYNC_CATEGORIES)

    async function exportEvents() {
      loading.value = true
      const minDate = minSyncDate()
      const maxDate = maxSyncDate()

      const options = toRaw(store.config.icalendarOptions)
      console.log(store.userId, minDate.toISO(), maxDate.toISO(), options)

      try {
        await exportIcs('IEN', minDate, maxDate, options)
        toastController.create({
          message: 'Exportation terminée',
          duration: 2000
        })
      } catch (err) {
        console.trace(err)
      }
      loading.value = false
    }

    return {
      store,
      exportEvents,
      loading,
      syncCategories
    }
  }
})
</script>

<style>
</style>
