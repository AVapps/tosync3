<template>
  <div class="calendar-sync-widget">
    <ion-list v-if="availableCalendars.length" inset="true">
      <ion-item>
        <ion-select
          :value="selectedCalendarIds"
          @ionChange="onCalendarsChange($event.target.value)"
          cancel-text="Annuler"
          ok-text="Valider"
          multiple="true"
          placeholder="Sélectionnez les calendriers à synchroniser"
          :interface-options="{
            header: 'Sélectionnez les calendriers à synchroniser',
          }"
        >
          <ion-select-option
            v-for="calendar in availableCalendars"
            :key="calendar.id"
            :value="calendar.id"
            >{{ calendar.displayName }}
          </ion-select-option>
        </ion-select>
      </ion-item>
    </ion-list>

    <loading-button v-else :loading="loading" @click="loadCalendars()">
      Charger la liste des calendriers
    </loading-button>

    <ion-list
      v-if="selectedCalendarIds && selectedCalendarIds.length"
      inset="true"
    >
      <ion-item v-for="id in selectedCalendarIds" :key="id">
        <ion-label>{{ availableCalendarsMap.get(id)?.name }}</ion-label>
        <ion-select
          :value="selectedCalendarsMap.get(id)?.tags || []"
          @ionChange="onTagsChange(id, $event.target.value)"
          slot="end"
          cancel-text="Annuler"
          ok-text="Valider"
          multiple="true"
          placeholder="Catégories d'évènements à inclure"
          :interface-options="{
            header: `Sélectionnez les catégories d'évènements à inclure`,
          }"
        >
          <ion-select-option
            v-for="tag in syncCategories"
            :key="tag"
            :value="tag"
            >{{ tag }}
          </ion-select-option>
        </ion-select>
      </ion-item>
    </ion-list>

    <loading-button :loading="loading" @click="syncEvents()">
      Synchronisation
    </loading-button>
  </div>
</template>

<script>
import { computed, defineComponent, ref, toRaw } from 'vue'
import {
  IonLabel,
  IonList,
  IonItem,
  IonSelect,
  IonSelectOption,
  toastController
} from '@ionic/vue'

import { difference, remove } from 'lodash'
import { useMainStore } from '@/store'
import {
  listCalendars,
  syncEventsInRange,
  minSyncDate,
  maxSyncDate
} from '@/lib/CalendarSync'

import LoadingButton from './LoadingButton.vue'
import { SYNC_CATEGORIES } from '@/lib/Export.js'

export default defineComponent({
  name: 'CalendarSyncWidget',
  props: {
    mini: {
      type: Boolean,
      default: false
    }
  },
  emits: ['login', 'logout'],
  components: {
    IonLabel,
    IonList,
    IonItem,
    IonSelect,
    IonSelectOption,
    LoadingButton
  },
  setup(_, { emit }) {
    const store = useMainStore()
    const loading = ref(false)

    const syncCategories = Object.keys(SYNC_CATEGORIES)

    const availableCalendars = ref([])
    const availableCalendarsMap = computed(
      () =>
        new Map(
          availableCalendars.value.map((calendar) => [calendar.id, calendar])
        )
    )

    const selectedCalendarsMap = computed(
      () =>
        new Map(
          store.config.syncCalendarsOptions.map((calendar) => [
            calendar.id,
            calendar
          ])
        )
    )

    const selectedCalendarIds = computed(() =>
      store.config.syncCalendarsOptions.map((calendar) => calendar.id)
    )

    function onCalendarsChange(calendarsId) {
      console.log('onCalendarsChange', calendarsId)
      const added = difference(calendarsId, selectedCalendarIds.value)
      const removed = difference(selectedCalendarIds.value, calendarsId)
      console.log(added, removed)

      store.$patch((state) => {
        remove(state.config.syncCalendarsOptions, ({ id }) =>
          removed.includes(id)
        )
        added.forEach((id) => {
          state.config.syncCalendarsOptions.push({ id, tags: syncCategories })
        })
      })
    }

    function onTagsChange(id, tags) {
      console.log('onTagsChange', id, tags)
      if (selectedCalendarsMap.value.has(id)) {
        selectedCalendarsMap.value.get(id).tags = tags
      }
    }

    async function loadCalendars() {
      loading.value = true
      try {
        availableCalendars.value = await listCalendars()
      } catch (err) {
        console.log(err)
      }
      loading.value = false
    }

    loadCalendars()

    async function syncEvents() {
      loading.value = true
      const minDate = minSyncDate()
      const maxDate = maxSyncDate()

      const calendars = toRaw(store.config.syncCalendarsOptions)
      console.log(calendars)

      try {
        await syncEventsInRange(store.userId, minDate, maxDate, calendars, {})
        toastController.create({
          message: 'Synchronisation terminée',
          duration: 2000
        })
      } catch (err) {
        console.trace(err)
      }
      loading.value = false
    }

    return {
      availableCalendars,
      availableCalendarsMap,
      selectedCalendarIds,
      selectedCalendarsMap,
      onCalendarsChange,
      onTagsChange,
      store,
      loadCalendars,
      syncEvents,
      loading,
      syncCategories
    }
  }
})
</script>

<style>
</style>
