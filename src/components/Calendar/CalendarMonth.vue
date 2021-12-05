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
import { ref, inject, watch, onUnmounted, nextTick } from 'vue'
import CalendarDay from './CalendarDay'
import { getDaysForMonth, WEEKDAYS } from './utils'
import { DateTime, Settings } from 'luxon'
// import { useMainStore } from '@/store'

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
    console.time(`setup CalendarMonth ${props.month?.toISODate()}`)
    const days = ref()
    const datasource = inject('datasource')
    // const store = useMainStore()

    // TODO : implement global state
    const state = {
      userId: 'IEN',
      isPNT: true
    }

    watch(
      () => props.month,
      async (month, prevMonth) => {
        await nextTick()
        if (prevMonth) {
          console.log(
            'watch.UNSUBSCRIBE',
            state.userId,
            prevMonth?.toISODate()?.substring(0, 7)
          )
          try {
            await datasource.unsubscribeMonth(state.userId, prevMonth)
          } catch (err) {
            console.log(err)
          }
        }
        days.value = getDaysForMonth(month)
        try {
          if (DateTime.isDateTime(month)) {
            console.log(
              'SUBSCRIBE',
              state.userId,
              month.toISODate().substring(0, 7)
            )
            await datasource.subscribeMonth(state.userId, month, state.isPNT)
            console.log(
              '%cSUBSCRIBED',
              'font-weight:bold',
              state.userId,
              month.toISODate().substring(0, 7)
            )
          }
        } catch (e) {
          // TODO : handle error
          console.log(e)
        }
      },
      { immediate: true }
    )

    onUnmounted(async () => {
      console.log(`${props.month.toISODate().substring(0, 7)} UNMOUNTED !`)
      try {
        await datasource.unsubscribeMonth(state.userId, props.month)
      } catch (e) {
        // TODO : handle error
        console.log(e)
      }
    })

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
  display: grid;
  grid-template: auto 1fr / 100%;
  height: 100%;
  font-family: 'DM Sans', sans-serif;

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
