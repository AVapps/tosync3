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
  --cal-font-mono: 'DM Mono', 'SF Mono', 'Roboto Mono', monospace;
  --cal-font-sans: 'DM Sans', 'SF Pro', Roboto, sans-serif;
  --cal-cell-padding: 0.25rem;
  --cal-event-row-gap: 2px;
  --cal-duty-padding: 2px;

  display: grid;
  grid-template: auto 1fr / 100%;
  height: 100%;
  font-family: var(--cal-font-sans);

  .av-calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    font-weight: bold;
    color: var(--cal-color-weekday);

    > * {
      padding: var(--cal-cell-padding);
    }

    .av-calendar-weekday-long {
      display: none;
    }

    @media screen and (max-width: 799px) {
      font-size: 2vw; /** 16px */
    }

    @media screen and (max-width: 549px) {
      font-size: 0.6875rem; /** 11px */
    }
  }

  .av-calendar-days {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    grid-template-rows: repeat(7, minmax(0, 1fr));
  }
}
</style>
