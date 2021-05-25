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
import { watch, reactive, inject, nextTick } from 'vue'
import CalendarDay from './CalendarDay'
import {
  updateDaysForMonth,
  getBlankCalendarDays,
  WEEKDAYS,
  getEvents
} from './utils'
import { DateTime, Settings } from 'luxon'

const TIMEZONE = 'Europe/Paris'
Settings.defaultLocale = 'fr'
Settings.defaultZoneName = TIMEZONE

export default {
  name: 'CalendarMonth',
  components: {
    CalendarDay
  },
  props: ['month'],
  setup(props) {
    const days = reactive(getBlankCalendarDays())
    const datasource = inject('datasource')

    // TODO : implement global state
    const state = {
      userId: 'IEN'
    }

    watch(
      () => props.month,
      async (month, prevMonth) => {
        console.log('update month', month?.toISODate(), prevMonth?.toISODate())
        updateDaysForMonth(days, month)
        await nextTick()
        try {
          if (month instanceof DateTime) {
            await datasource.subscribe(state.userId, month)
          }
          if (prevMonth instanceof DateTime) {
            await datasource.unsubscribe(state.userId, prevMonth)
          }
        } catch (e) {
          // TODO : handle error
          console.error(e)
        }
      },
      { immediate: true }
    )

    return {
      days,
      weekdays: WEEKDAYS
    }
  }
}
</script>

<style lang="scss">
.av-calendar-month {
  display: grid;
  grid-template: auto 1fr / 100%;
  height: 100%;

  .av-calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.25rem;
    font-weight: bold;

    > * {
      padding: 0.25rem;
    }

    .av-calendar-weekday-long {
      display: none;
    }
  }

  .av-calendar-days {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    grid-template-rows: repeat(7, minmax(0, 1fr));
    gap: 0.25rem;
  }
}
</style>



