<template>
<ion-modal
  :is-open="modalOpenRef"
  :swipe-to-close="true"
  :presenting-element="$parent.$refs.ionRouterOutlet"
  @didDismiss="closeModal()"
>
  <ion-page>
    <ion-header collapse="fade">
      <ion-toolbar>
        <ion-title>Activitées non signées</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="onCloseClick()">Fermer</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list inset>
        <ion-item>
          <ion-label>Fuseau horaire</ion-label>
          <timezone-toggle @ion-change="setTimezone" />
        </ion-item>
      </ion-list>
      <ion-list>
        <template v-for="(events, date) in activitiesByDate" :key="date">
          <ion-item class="date">
            {{ isoDateToString(date) }}
          </ion-item>
          <template v-for="event in events" :key="event.opsLegCrewId">
            <ion-item v-if="event.displayCheckIn">
              <ion-icon :icon="enterOutline" size="small" slot="end"/>
              <ion-label slot="end">{{ timeFromISO(event.checkIn) }}</ion-label>
            </ion-item>
            <ion-item class="activity">
              <div slot="start" class="event-bar" :class="'tosync-bg-' + findActivityTag(event)"></div>
              <ion-label>
                {{ getActivityTitle(event) }}
                <br>
                <ion-note>{{ getActivityExtras(event) }}</ion-note>
              </ion-label>
              <div slot="end" class="time-slot">
                <span class="start">{{ timeFromISO(event.start) }}</span>
                <span class="end">{{ timeFromISO(event.end) }}</span>
              </div>
            </ion-item>
            <ion-item v-if="event.displayCheckOut">
              <ion-icon :icon="logOutOutline" size="small" slot="end"/>
              <ion-label slot="end">{{ timeFromISO(event.checkOut) }}</ion-label>
            </ion-item>
          </template>
        </template>
      </ion-list>
    </ion-content>
    <ion-footer collapse="fade">
      <ion-toolbar>
        <ion-buttons slot="primary">
          <ion-button @click="onConfirmClick()">Tout signer ({{ activities.length }})</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</ion-modal>
</template>

<script setup>
import { IonPage, IonContent, IonHeader, IonFooter, IonToolbar, IonTitle, IonButtons, IonButton, IonList, IonItem, IonListHeader, IonLabel, IonNote, IonIcon } from '@ionic/vue'
import { enterOutline, logOutOutline } from 'ionicons/icons'
import { computed, ref } from 'vue'
import { groupBy } from 'lodash'
import { DateTime } from 'luxon'
import { isoDateToString } from '@/helpers/dates'
import { findActivityTag } from '@/helpers/events'
import TimezoneToggle from './TimezoneToggle.vue'

// eslint-disable-next-line no-undef
const emit = defineEmits(['modal:close', 'modal:confirm'])

// eslint-disable-next-line no-undef
const props = defineProps({
  activities: {
    type: Array,
    default: () => []
  }
})

const timezone = ref('Europe/Paris')
function setTimezone(event) {
  timezone.value = event.detail.checked ? 'UTC' : 'Europe/Paris'
}

const modalOpenRef = ref(false)

function openModal() {
  modalOpenRef.value = true
}

function closeModal() {
  modalOpenRef.value = false
}

function onCloseClick() {
  closeModal()
  emit('modal:close')
}

function onConfirmClick() {
  closeModal()
  emit('modal:confirm')
}

// eslint-disable-next-line no-undef
defineExpose({
  openModal,
  closeModal
})

const activitiesByDate = computed(() => groupBy(props.activities, act => act.start.substring(0, 10)))
console.log(activitiesByDate.value)

function getActivityTitle(activity) {
  switch (activity.activityType) {
    case 'F':
      return `${activity.flightNumber} (${activity.departureAirportCode}-${activity.arrivalAirportCode}) ${activity.flightAircraftVersion}`
    case 'S':
    case 'P':
    case 'O':
    case 'T':
      return `${activity.description}: ${activity.deadheadDescription} (${activity.departureAirportCode}-${activity.arrivalAirportCode}) `
    case 'H':
      return activity.details
    case 'G':
    default:
      return activity.description
  }
}

function getActivityExtras(activity) {
  switch (activity.activityType) {
    case 'F':
    case 'S':
    case 'P':
    case 'O':
    case 'T':
      return `${activity.departureAirportName} - ${activity.arrivalAirportName}`
    case 'H':
      return activity.hotelAddress
    case 'G':
      return `${activity.groundCode} ${activity.departureAirportCode ?? '' }`
    default:
      return activity.details
  }
}

function timeFromISO(iso) {
  return DateTime.fromISO(iso).setZone(timezone.value).toFormat('HH:mm')
}

</script>

<style lang="scss" scoped>
ion-list {
  margin: 1rem;
  border-radius: 10px;

  ion-item:first-child {
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
  }

  ion-item:last-child {
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
    
    &::part(native) .inner-item {
      border-bottom: none;
    }
  }
}

ion-item {
  &.date {
    text-transform: uppercase;
    --inner-padding-top: 10px;
  }

  &.activity {
    align-items: flex-start;
  }

  .event-bar {
    display: block;
    align-self: stretch;
    width: 4px;
    border-radius: 2px;
    margin-top: 10px;
    margin-bottom: 10px;
    margin-inline-end: 8px;
  }

  .time-slot {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    margin-top: 10px;
    margin-bottom: 10px;

    > .end {
      color: var(--ion-text-muted-color);
    }
  }
}
</style>