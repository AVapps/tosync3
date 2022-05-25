<template>
  <ion-modal
    :is-open="modalOpenRef"
    swipe-to-close
    :presenting-element="$parent.$refs.ionRouterOutlet"
    @didDismiss="closeModal()"
  >
    <ion-page>
      <ion-header collapse="fade">
        <ion-toolbar>
          <ion-title>Importation CrewConnect</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list inset>
          <ion-item button @click="importLast3Months()" :disabled="state.isLoading">
            <ion-icon :icon="cloudDownloadOutline" slot="start" />
            Importer les 3 derniers mois
          </ion-item>
          <ion-item button @click="importLast12Months()" :disabled="state.isLoading">
            <ion-icon :icon="cloudDownloadOutline" slot="start" />
            Importer les 12 derniers mois
          </ion-item>
        </ion-list>
        <ion-list-header>
          <ion-label>Dates personnalisées</ion-label>
        </ion-list-header>
        <ion-note class="list-note">
          Sélectionnez les dates de début et de fin de l'interval à importer.<br>
          (Maximum 1 an)
        </ion-note>
        <ion-list inset class="ion-margin-top">
          <ion-accordion-group>
            <ion-accordion value="from">
              <ion-item slot="header" :disabled="state.isLoading">
                <ion-icon :icon="calendarOutline" slot="start" />
                <ion-label>Du</ion-label>
                <ion-note>{{ toLocaleString(state.fromDate, DATE_FORMAT) }}</ion-note>
              </ion-item>
              <ion-item slot="content">
                <ion-datetime
                  v-model="state.fromDate" 
                  presentation="date"
                  size="cover"
                  :min="minDate"
                  :max="maxDate" />
              </ion-item>
            </ion-accordion>
            <ion-accordion value="to">
              <ion-item slot="header" :disabled="state.isLoading">
                <ion-icon :icon="calendarOutline" slot="start" />
                <ion-label>Au</ion-label>
                <ion-note>{{ toLocaleString(state.toDate, DATE_FORMAT) }}</ion-note>
              </ion-item>
              <ion-item slot="content">
                <ion-datetime
                  v-model="state.toDate"
                  presentation="date"
                  size="cover"
                  :min="minDate"
                  :max="maxDate" />
              </ion-item>
            </ion-accordion>
          </ion-accordion-group>
        </ion-list>
        <loading-button
          @click="importCustomInterval()"
          :loading="state.isLoading"
          expand="block"
          class="ion-margin-start ion-margin-end">
          Importer
        </loading-button>
        <ion-note v-if="state.error" class="list-note ion-text-center" color="danger">
          {{ state.error }}
        </ion-note>
      </ion-content>
    </ion-page>
  </ion-modal>
</template>

<script setup>
import { useConnect, useMainStore, usePlanning } from '@/store'
import { cloudDownloadOutline, calendarOutline } from 'ionicons/icons'
import LoadingButton from './LoadingButton.vue'
import { toLocaleString } from '@/helpers/dates'
import { DateTime } from 'luxon'
import { computed, ref, reactive, watch } from 'vue'

const DATE_FORMAT = { month: 'long', day: 'numeric', year: 'numeric' }

const mainStore = useMainStore()
const connect = useConnect()
const planning = usePlanning()

const state = reactive({
  fromDate: '2021-01-01',
  toDate: '2021-12-31',
  isLoading: false,
  error: ''
})

const minDate = '2010-01-01'
const absMaxDate = DateTime.local().endOf('day').plus({ days: 31 }).toISODate()
const maxDate = computed(() => {
  const oneYearMax = DateTime.fromISO(state.fromDate).plus({ year: 1 }).toISODate()
  return absMaxDate < oneYearMax ? absMaxDate : oneYearMax
})

watch(
  () => state.fromDate,
  fromDate => {
    if (state.toDate < state.fromDate) {
      state.toDate = state.fromDate
    } else {
      const oneYearMax = DateTime.fromISO(state.fromDate).plus({ year: 1 }).toISODate()
      if (state.toDate > oneYearMax) {
        state.toDate = oneYearMax
      }
    }
  }
)

async function importLast3Months() {
  const dateFrom = DateTime.local().startOf('month').minus({ months: 3 }).toUTC().toISO()
  const dateTo = DateTime.local().endOf('day').toUTC().toISO()
  return importRosterCalendars(dateFrom, dateTo)
}

async function importLast12Months() {
  const dateFrom = DateTime.local().startOf('month').minus({ months: 12 }).toUTC().toISO()
  const dateTo = DateTime.local().endOf('day').toUTC().toISO()
  return importRosterCalendars(dateFrom, dateTo)
}

async function importCustomInterval() {
  return importRosterCalendars(
    DateTime.fromISO(state.fromDate).toUTC().toISO(),
    DateTime.fromISO(state.toDate).toUTC().toISO()
  )
}

async function importRosterCalendars(dateFrom, dateTo) {
  state.isLoading = true
  state.error = ''
  try {
    await mainStore.syncPlanningInterval({ dateFrom, dateTo })
  } catch (error) {
    console.log(error)
    state.error = error?.message || error?.error || "Une erreur s'est produite lors de l'importation"
  } finally {
    state.isLoading = false
  }
}


// eslint-disable-next-line no-undef
const emit = defineEmits(['modal:close', 'modal:confirm'])

const modalOpenRef = ref(false)

function openModal() {
  modalOpenRef.value = true
}

function closeModal() {
  modalOpenRef.value = false
}

// eslint-disable-next-line no-undef
defineExpose({
  openModal,
  closeModal
})

function onCloseClick() {
  closeModal()
  emit('modal:close')
}

function onConfirmClick() {
  closeModal()
  emit('modal:confirm')
}
</script>

<style lang="scss" scoped>
ion-datetime {
  --background: transparent;
}
.list-note {
  display: block;
  padding-inline-start: 20px;
  padding-inline-end: 20px;
}
</style>