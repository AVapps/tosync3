<template>
  <div class="calendar-sync-widget">
    <p v-if="!hasPermission">Vous n'avez pas autorisé TO.sync à accéder à vos calendriers : activeze l'accès depuis Réglages > TO.sync.</p>

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
import { computed, defineComponent, ref, toRaw, watchEffect } from 'vue'
import {
  IonLabel,
  IonList,
  IonItem,
  IonSelect,
  IonSelectOption,
  toastController
} from '@ionic/vue'

import { difference, remove } from 'lodash'
import { useUser } from '@/store'
import {
  checkPermissions,
  listCalendars,
  syncEventsInRange,
  minSyncDate,
  maxSyncDate
} from '@/lib/CalendarSync'

import LoadingButton from './LoadingButton.vue'
import { SYNC_CATEGORIES } from '@/lib/Export.js'

export default defineComponent({
  name: 'CalendarSyncWidget',
  components: {
    IonLabel,
    IonList,
    IonItem,
    IonSelect,
    IonSelectOption,
    LoadingButton
  },
  setup(_, { emit }) {
    const user = useUser()

    const loading = ref(false)

    const syncCategories = Object.keys(SYNC_CATEGORIES)
    const hasPermission = ref(false)

    checkPermissions()
      .then(state => {
        console.log(state)
        hasPermission.value = state.calendar !== 'denied'
      })
      .catch(err => {
        console.log(err)
      })

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
          user.config.syncCalendarsOptions.map((calendar) => [
            calendar.id,
            calendar
          ])
        )
    )

    const selectedCalendarIds = computed(() =>
      user.config.syncCalendarsOptions.map((calendar) => calendar.id)
    )

    function onCalendarsChange(calendarsId) {
      console.log('onCalendarsChange', calendarsId)
      const added = difference(calendarsId, selectedCalendarIds.value)
      const removed = difference(selectedCalendarIds.value, calendarsId)
      console.log(added, removed)

      user.$patch((state) => {
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

      const calendars = toRaw(user.config.syncCalendarsOptions)
      console.log(calendars)

      try {
        await syncEventsInRange(user.userId, minDate, maxDate, calendars, {})
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
      hasPermission,
      availableCalendars,
      availableCalendarsMap,
      selectedCalendarIds,
      selectedCalendarsMap,
      onCalendarsChange,
      onTagsChange,
      user,
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
