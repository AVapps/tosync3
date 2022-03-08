<template>
<div class="month-picker">
  <ion-button id="av-month-picker-button" color="primary" fill="clear">
    <span class="month">{{ monthLabel.month }}</span>
    &nbsp;
    <span class="year">{{ monthLabel.year }}</span>
  </ion-button>
  <ion-popover class="month-picker-popover" trigger="av-month-picker-button">
    <ion-datetime
      presentation="month-year"
      cancel-text="Annuler"
      clear-text="Effacer"
      done-text="OK"
      first-day-of-week="1"
      :show-default-buttons="true"
      :size="'cover'"
      :min="min"
      :max="max"
      :value="month"
      @ion-change="onMonthSelect"
    />
  </ion-popover>

  <div class="actions">
    <ion-button
      color="primary"
      fill="clear"
      size="small"
      @click="prevMonth"
      :disabled="min?.substring(0, 7) === month?.substring(0, 7)"
    >
      <ion-icon :icon="chevronBack"></ion-icon>
    </ion-button>
    <ion-button
      color="primary"
      fill="clear"
      size="small"
      @click="presentMonth"
    >
      <ion-icon :icon="ellipseOutline"></ion-icon>
    </ion-button>
    <ion-button
      color="primary"
      fill="clear"
      size="small"
      @click="nextMonth"
      :disabled="max?.substring(0, 7) === month?.substring(0, 7)"
    >
      <ion-icon :icon="chevronForward"></ion-icon>
    </ion-button>
  </div>
</div>
</template>

<script setup>
import { IonButton, IonIcon, IonDatetime, IonPopover } from '@ionic/vue'
import { chevronBack, chevronForward, ellipseOutline } from 'ionicons/icons'
import { DateTime } from 'luxon'
import { computed, ref } from 'vue'

// eslint-disable-next-line no-undef
const props = defineProps({
  min: {
    type: String,
    default: '',
    validator: value => value == '' || /^\d{4}-\d{2}(-\d{2})?$/.test(value)
  },
  max: {
    type: String,
    default: '',
    validator: value => value == '' || /^\d{4}-\d{2}(-\d{2})?$/.test(value)
  },
  month: {
    type: String,
    default: '',
    validator: (value) => value == '' || /^\d{4}-\d{2}(-\d{2})?$/.test(value)
  }
})
// eslint-disable-next-line no-undef
const emit = defineEmits(['update:month'])

// const monthISO = ref(props.month)
const monthDT = computed(() => DateTime.fromISO(props.month).startOf('month'))
const monthLabel = computed(() => ({
  month:  monthDT.value.toLocaleString({ month: 'long' }),
  year: monthDT.value.toLocaleString({ year: 'numeric' })
}))

const onMonthSelect = (e) => {
  const sub = e.target.value?.substring(0, 7)
  emit('update:month', sub)
}

const prevMonth = () => {
  const prev = monthDT.value.minus({ month: 1 }).toISODate().substring(0, 7)
  emit('update:month', prev)
}

const nextMonth = () => {
  const next = monthDT.value.plus({ month: 1 }).toISODate().substring(0, 7)
  emit('update:month', next)
}

const presentMonth = () => {
  const present = DateTime.local().startOf('month').toISODate().substring(0, 7)
  emit('update:month', present)
}
</script>

<style lang="scss" scoped>
.month-picker {
  display: inline-flex;
  min-width: 230px;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;

  ion-button#av-month-picker-button {
    color: var(--ion-color-success);
    text-transform: capitalize;
    transition: opacity 0.15s ease-in;
    --padding-start: 0;
    --padding-end: 0;

    &.fade {
      opacity: 0;
      transform: translateX(-5px);
      transition: opacity 0.15s ease-out;
    }

    .month {
      font-weight: bold;
    }
  }

  .actions {
    display: inline-flex;

    > ion-button {
      --padding-start: 5px;
      --padding-end: 5px;
    }
  }
}

</style>