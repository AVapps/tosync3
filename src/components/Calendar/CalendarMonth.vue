<template>
  <div class="av-calendar-month">
    <div class="av-calendar-weekdays">
      <div v-for="weekday in weekdays" :key="weekday.short" class="av-calendar-weekday-long">{{ weekday.long }}</div>
      <div v-for="weekday in weekdays" :key="weekday.short" class="av-calendar-weekday-short">{{ weekday.short }}</div>
    </div>
    <div class="av-calendar-days">
      <calendar-day v-for="(day, index) in days" :day="day" :key="index"></calendar-day>
    </div>
  </div>
</template>

<script>
import { watchEffect, reactive, nextTick } from 'vue'
import CalendarDay from './CalendarDay'
import { updateDaysForMonth, getBlankCalendarDays, WEEKDAYS, getEvents } from './utils'
import { DateTime, Settings } from 'luxon'

const TIMEZONE = 'Europe/Paris'
Settings.defaultLocale = 'fr'
Settings.defaultZoneName = TIMEZONE

export default {
  name: 'CalendarMonth',
  components: {
    CalendarDay
  },
  props: ['displayedMonth'],
  setup(props) {
    const days = reactive(getBlankCalendarDays())
    const daysMap = new Map()

    // TODO get global state
    const state = {
      userId: 'IEN'
    }

    watchEffect(async () => {
      daysMap.clear()
      updateDaysForMonth(days, props.displayedMonth)
      await nextTick()
      days.forEach(day => {
        daysMap.set(day.iso, day)
      })
      const start = props.displayedMonth.startOf('month').startOf('week').valueOf()
      const end = props.displayedMonth.endOf('month').endOf('week').valueOf()
      try {
        console.time('getEvents')
        const events = await getEvents({ userId: state.userId, start, end })
        events.forEach(evt => {
          let cursor = DateTime.fromMillis(evt.start).startOf('day')
          while (cursor <= evt.end) {
            const iso = cursor.toISODate()
            if (daysMap.has(iso)) {
              daysMap.get(iso).events.push(evt)
            }
            cursor = cursor.plus({ day: 1 })
          }
        })
        console.timeEnd('getEvents')
      } catch (err) {
        // TODO handle error
        console.error(err)
      }
    })

    

    return {
      days,
      weekdays: WEEKDAYS
    }
  }
}
</script>

<style lang="scss" scoped>
  .av-calendar-month {
    display: grid;
    grid-template: auto 1fr / 100%;
    height: 100%;

    .av-calendar-weekdays {
      display: grid;
      grid-template-columns: repeat(7,1fr);
      font-weight: bold;

      > * {
        padding: .25rem 0;
      }

      .av-calendar-weekday-long {
        display: none;
      }
    }

    .av-calendar-days {
      display: grid;
      grid-template-columns: repeat(7,1fr);
      gap: 0.25rem;

      :deep(.av-calendar-day) {
        border-radius: var(--border-radius);
        background: rgba(255,255,255,0.1);
        padding: 0.25rem;

        &:hover {
          background: rgba(255,255,255,0.2);
        }

        .av-calendar-weekday {
          display: none;
        }

        .av-calendar-badge {
          height: 1rem;
          border-radius: 50%;
        }
        
      }
    }
  }
</style>



