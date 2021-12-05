<template>
  <div class="calendar-sync-widget">
    <ion-list v-if="calendars.length" inset="true">
      <ion-item>
        <ion-select
          v-model="store.config.syncCalendars"
          cancel-text="Annuler"
          ok-text="Valider"
          multiple="true"
          placeholder="Sélectionnez les calendriers à synchroniser"
          :interface-options="{
            header: 'Sélectionnez les calendriers à synchroniser',
          }"
        >
          <ion-select-option
            v-for="calendar in calendars"
            :key="calendar.id"
            :value="calendar.id"
            >{{ calendar.name }}
          </ion-select-option>
        </ion-select>
      </ion-item>
    </ion-list>
    <loading-button v-else :loading="loading" @click="loadCalendars()">
      Charger la liste des calendriers
    </loading-button>

    <ion-list v-if="selectedCalendars && selectedCalendars.length" inset="true">
      <ion-item v-for="id in selectedCalendars" :key="id">
        <ion-label>{{ calendarsMap.get(id)?.name }}</ion-label>
        <ion-select
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
            v-for="tag in [
              'vol',
              'repos',
              'conges',
              'sol',
              'instruction',
              'blanc',
            ]"
            :key="tag"
            :value="tag"
            >{{ tag }}
          </ion-select-option>
        </ion-select>
      </ion-item>
    </ion-list>
  </div>
</template>

<script>
import { computed, defineComponent, ref, watch } from 'vue'
import {
  IonButton,
  IonChip,
  IonLabel,
  IonList,
  IonItem,
  IonIcon,
  IonRadio,
  IonSelect,
  IonSelectOption,
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

import { has } from 'lodash'
import { useMainStore } from '@/store'
import { listCalendars } from '@/lib/CalendarSync'

import LoadingButton from './LoadingButton.vue'

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
    IonButton,
    IonChip,
    IonLabel,
    IonList,
    IonItem,
    IonIcon,
    IonRadio,
    IonSelect,
    IonSelectOption,
    LoadingButton
  },
  setup(_, { emit }) {
    const store = useMainStore()
    const loading = ref(false)

    const calendars = ref([])
    const calendarsMap = ref(new Map())
    const selectedCalendars = computed(() => store.config.syncCalendars)

    watch(selectedCalendars, list => {
      list.forEach(c => {
        if (!has(store.config.syncCalendarsOptions, c.id)) {
          store.config.syncCalendarsOptions[c.id] = {
            tags: []
          }
        }
      })
    })

    async function loadCalendars() {
      loading.value = true
      try {
        calendars.value = await listCalendars()
        calendarsMap.value = new Map()
        calendars.value.forEach(c => calendarsMap.value.set(c.id, c))
      } catch (err) {
        console.log(err)
      }
      loading.value = false
    }

    loadCalendars()

    return {
      calendars,
      calendarsMap,
      selectedCalendars,
      store,
      loadCalendars,
      loading
    }
  }
})
</script>

<style>
</style>
