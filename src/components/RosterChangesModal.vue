<template>
<ion-modal
  :is-open="modalOpenRef"
  :swipe-to-close="false"
  :presenting-element="$parent.$refs.ionRouterOutlet"
  @didDismiss="closeModal()"
>
  <ion-page>
    <ion-header collapse="fade">
      <ion-toolbar>
        <ion-title>Modifications de planning</ion-title>
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
        <template v-for="(events, date) in changesByDate" :key="date">
          <ion-item class="date" lines="full">
            {{ isoDateToString(date) }}
          </ion-item>
          <template v-for="event in events" :key="event.changeKeyOpsLegCrewId">
            <template v-if="['DEL', 'OLD', 'MOD'].includes(event.changeStatus)">
              <ion-item class="activity" :lines="event.changeStatus ==='MOD' ? 'none' : ''">
                <ion-icon slot="start" color="danger" :icon="removeCircleOutline" />
                <div slot="start" class="event-bar" :class="'tosync-bg-' + findChangeTag(event)"></div>
                <ion-label>
                  <ion-badge v-if="tag(event.oldType) === 'mep'" color="secondary">MEP</ion-badge>
                  {{ getOldTitle(event) }}
                </ion-label>
                <div slot="end" class="time-slot">
                  <span class="start">{{ timeFromUtcISO(event.oldStd) }}</span>
                  <span class="end">{{ timeFromUtcISO(event.oldSta) }}</span>
                </div>
              </ion-item>
            </template>
            <template v-if="['NEW', 'MOD'].includes(event.changeStatus)">
              <ion-item class="activity">
                <ion-icon slot="start" color="success" :icon="addCircleOutline" />
                <div slot="start" class="event-bar" :class="'tosync-bg-' + findChangeTag(event)"></div>
                <ion-label>
                  <ion-badge v-if="tag(event.newType) === 'mep'" color="secondary">MEP</ion-badge>
                  {{ getNewTitle(event) }}
                </ion-label>
                <div slot="end" class="time-slot">
                  <span class="start">{{ timeFromUtcISO(event.newStd) }}</span>
                  <span class="end">{{ timeFromUtcISO(event.newSta) }}</span>
                </div>
              </ion-item>
            </template>
          </template>
        </template>
      </ion-list>
    </ion-content>
    <ion-footer collapse="fade">
      <ion-toolbar>
        <ion-buttons slot="primary">
          <ion-button @click="onConfirmClick()">Tout valider ({{ changes.length }})</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</ion-modal>
</template>

<script setup>
import { addCircleOutline, removeCircleOutline } from 'ionicons/icons'
import { computed, ref } from 'vue'
import { groupBy, sortBy } from 'lodash'
import { DateTime } from 'luxon'
import { isoDateToString } from '@/helpers/dates'
import { findChangeTag } from '@/helpers/events'
import TimezoneToggle from './TimezoneToggle.vue'

// eslint-disable-next-line no-undef
const emit = defineEmits(['modal:close', 'modal:confirm'])

// eslint-disable-next-line no-undef
const props = defineProps({
  changes: {
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

const changesByDate = computed(() => groupBy(sortBy(props.changes, 'newSta'), act => act.dateRef.substring(0, 10)))

function tag(type) {
  switch (type) {
    case 'F':
      return 'vol'
    case 'S':
    case 'P':
    case 'O':
    case 'T':
      return 'mep'
    case 'H':
      return 'hotel'
    case 'G':
    default:
      return 'sol'
  }
}

function getNewTitle(activity) {
  switch (activity.newType) {
    case 'F':
      return `${activity.newDesc} (${activity.newForm}-${activity.newTo}) ${activity.newAcType ?? ''}`
    case 'S':
    case 'P':
    case 'O':
    case 'T':
      return `${activity.newDesc} (${activity.newForm}-${activity.newTo}) ${activity.newAcType ?? ''}`
    case 'H':
    case 'G':
    default:
      return `${activity.newDesc} (${activity.newForm ?? ''})`
  }
}

function getOldTitle(activity) {
  switch (activity.oldType) {
    case 'F':
      return `${activity.oldDesc} (${activity.oldFrom}-${activity.oldTo}) ${activity.oldAcType ?? ''}`
    case 'S':
    case 'P':
    case 'O':
    case 'T':
      return `${activity.oldDesc} (${activity.oldFrom}-${activity.oldTo}) ${activity.oldAcType ?? ''}`
    case 'H':
    case 'G':
    default:
      return `${activity.oldDesc} (${activity.oldFrom ?? ''})`
  }
}

function timeFromUtcISO(iso) {
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

      > ion-icon {
        align-self: center;
      }
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