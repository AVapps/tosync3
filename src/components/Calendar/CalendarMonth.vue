<template>
  <div class="av-calendar-month">
    <div class="av-calendar-weekdays">
      <div
        v-for="weekday in weekdays"
        :key="weekday.short"
        class="av-calendar-weekday-long"
      >
        {{ weekday.long }}
      </div>
      <div
        v-for="weekday in weekdays"
        :key="weekday.short"
        class="av-calendar-weekday-short"
      >
        {{ weekday.short }}
      </div>
    </div>
    <div class="av-calendar-days">
      <calendar-day
        v-for="(day, index) in days"
        :day="day"
        :key="index"
      ></calendar-day>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import CalendarDay from './CalendarDay'
import { getDaysForMonth, WEEKDAYS } from './utils'

export default {
  name: 'CalendarMonth',
  components: {
    CalendarDay
  },
  props: ['month'],
  setup(props) {
    console.time(`setup CalendarMonth ${props.month?.toISODate()}`)
    const days = ref()

    // TODO : implement global state
    const state = {
      userId: 'IEN',
      isPNT: true
    }

    days.value = getDaysForMonth(props.month, state)

    console.timeEnd(`setup CalendarMonth ${props.month?.toISODate()}`)

    return {
      days,
      weekdays: WEEKDAYS
    }
  }
}
</script>

<style lang="scss">
.av-calendar-month {
  --cal-title-font-size: 85%;
  --cal-duty-time-font-size: 75%;
  --cal-time-font-size: 75%;
  --cal-weekday-font-size: clamp(0.6875rem, min(2vh, 2vw), 1rem);
  --cal-date-font-size: clamp(0.6875rem, min(2vh, 2vw), 1rem);
  --cal-content-font-size: clamp(0.625rem, min(1.75vh, 1.75vw), 0.875rem);
  --cal-font-mono: 'DM Mono', 'SF Mono', 'Roboto Mono', monospace;
  --cal-font-sans: 'DM Sans', 'SF Pro', Roboto, sans-serif;
  --cal-cell-padding: 0.25rem;
  --cal-event-row-gap: 2px;
  --cal-duty-padding: 2px 3px;
  --cal-duty-border-radius: 3px;

  --cal-padding-top: calc(56px + var(--ion-safe-area-top));
  --footer-height: 61px;
  --cal-height: calc(100vh - var(--footer-height) - var(--ion-safe-area-bottom));
  --cal-weekdays-height: 1.5rem;
  --cal-days-grid-height: calc(var(--cal-height) - var(--cal-padding-top) - var(--cal-weekdays-height) - 6px);
  --cal-cell-height: minmax(6rem, calc(var(--cal-days-grid-height) / 6));

  display: grid;
  grid-template: auto 1fr / 100%;
  height: var(--cal-height);
  padding-top: var(--cal-padding-top);
  font-family: var(--cal-font-sans);
  overflow-y: scroll;
  will-change: scroll-position;

  &::-webkit-scrollbar {
    display: none;
  }

  .av-calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    font-size: var(--cal-weekday-font-size);
    font-weight: bold;
    color: var(--cal-color-weekday);

    > * {
      padding: var(--cal-cell-padding);
    }

    .av-calendar-weekday-long {
      display: none;
    }
  }

  .av-calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(6, var(--cal-cell-height));
  }

  @media screen and (max-height: 420px) {
    --cal-cell-height: minmax(7rem, 1fr);
  }
}
</style>
