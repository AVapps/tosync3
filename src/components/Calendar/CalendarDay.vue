<template>
  <div class="av-calendar-day" :class="day.classes">
    <div class="av-calendar-weekday">{{ day.weekday }}</div>
    <div class="av-calendar-date">{{ day.day }}</div>
    <div class="av-calendar-badge"></div>
    <div class="av-calendar-content">
      <div v-for="evt in day.events" :key="evt._id">
        <span class="tag">{{ evt.tag }}</span>
        <span class="start">{{ getTime(evt.start) }}</span>
        <span class="title">{{ evt.summary }}</span>
        <span class="end">{{ getTime(evt.end) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { DateTime, Settings } from 'luxon'

const TIMEZONE = 'Europe/Paris'
Settings.defaultLocale = 'fr'
Settings.defaultZoneName = TIMEZONE

export default defineComponent({
  name: 'CalendarDay',
  props: [ 'day' ],
  setup() {
    function getTime(ts) {
      return DateTime.fromMillis(ts).toFormat('HH:mm')
    }
    return {
      getTime
    }
  }
})
</script>

<style lang="scss" scoped>
  .av-calendar-day {
    &.hidden {
      visibility: hidden;
    }

    &.adjacent-month {
      opacity: 0.5;
    }

    .av-calendar-weekday {
      
    }

    .av-calendar-date {
      
    }

    .av-calendar-badge {
      
    }

    .av-calendar-content {
      
    }
  }
</style>