<template>
  <div class="av-calendar-day" :class="[...day.classes, ...state.tags]">
    <div class="av-calendar-weekday">{{ day.weekday }}</div>
    <div class="av-calendar-date">{{ day.day }}</div>
    <div class="av-calendar-content">
      <div
        class="av-calendar-event"
        v-for="evt in state.events"
        v-is="eventComponent(evt)"
        :key="evt._id"
        :event="evt"
        :date="day.date"
        :class="eventClass(evt, state.date)"
      ></div>
    </div>
  </div>
</template>

<script>
import { defineComponent, inject, ref, computed } from 'vue'
import { DateTime, Settings } from 'luxon'
import { eventClass, isAlldayTag } from './utils'

import AlldayEvent from './Events/AlldayEvent'
import DefaultEvent from './Events/DefaultEvent'
import DutyEvent from './Events/DutyEvent'
import RotationEvent from './Events/RotationEvent'

const TIMEZONE = 'Europe/Paris'
Settings.defaultLocale = 'fr'
Settings.defaultZoneName = TIMEZONE

export default defineComponent({
  name: 'CalendarDay',
  props: ['day'],
  setup(props) {
    const zone = ref('Europe/Paris')
    const locale = ref('fr')
    const datasource = inject('datasource')

    // TODO : implement global state
    const globalState = {
      userId: 'IEN'
    }

    const state = computed(() => {
      const dayState = datasource.getDay(globalState.userId, props.day.iso)
      return (
        dayState || {
          date: props.day.iso,
          tags: [],
          allday: false,
          label: '',
          events: []
        }
      )
    })

    function getTime(ts) {
      return DateTime.fromMillis(ts, {
        zone: zone.value,
        locale: locale.value
      }).toFormat('HH:mm')
    }

    function eventComponent(evt) {
      if (isAlldayTag(evt.tag)) {
        return AlldayEvent
      }
      if (evt.tag === 'rotation') {
        return RotationEvent
      }
      if (evt.events) {
        return DutyEvent
      }
      return DefaultEvent
    }

    return {
      state,
      eventComponent,
      eventClass,
      getTime
    }
  }
})
</script>

<style lang="scss">
.av-calendar-day {
  display: grid;
  grid-template-columns: 100%;
  grid-row-gap: 0.25rem;
  align-content: start;
  font-size: 0.8rem;
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &.hidden {
    visibility: hidden;
  }

  &.adjacent-month {
    opacity: 0.5;
  }

  .av-calendar-weekday {
    display: none;
  }

  .av-calendar-date {
    font-size: 1rem;
  }

  &.calendar-dow-1 {
    .av-calendar-content .av-calendar-event.span-left {
      margin-left: -0.25rem;
      padding-left: 0.5rem;
    }
  }

  &.calendar-dow-7 {
    .av-calendar-content .av-calendar-event.span-right {
      margin-right: -0.25rem;
      padding-right: 0.5rem;
    }
  }

  .av-calendar-content {
    display: grid;
    grid-auto-columns: 1fr;
    gap: 2px;

    .av-calendar-event {
      padding: 0.25rem;
      border-radius: 0.5rem;

      &.span-right {
        margin-right: -0.375rem;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        padding-right: 0.625rem;
      }

      &.span-left {
        margin-left: -0.375rem;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        padding-left: 0.625rem;
      }
    }
  }
}
</style>
