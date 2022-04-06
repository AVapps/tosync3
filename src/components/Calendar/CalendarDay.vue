<template>
  <div class="av-calendar-day" :class="[...day.classes, ...state.tags]">
    <div class="av-calendar-weekday">{{ day.weekday }}</div>
    <div class="av-calendar-date">{{ day.day }}</div>
    <div class="av-calendar-day-hints">
      <span
        v-for="(hint, index) in state.hints"
        :key="index"
        :class="hint"
      ></span>
    </div>
    <div class="av-calendar-content">
      <component
        class="av-calendar-event"
        v-for="evt in state.events"
        :is="eventComponent(evt)"
        :key="evt._id"
        :event="evt"
        :date="day.date"
        :class="eventClass(evt, state.date)"
      ></component>
    </div>
  </div>
</template>

<script>
import { defineComponent, inject, ref, computed } from 'vue'
import { DateTime, Settings } from 'luxon'
import { eventClass, isAlldayTag } from '@/helpers/calendar'

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
          hints: [],
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
  grid-row-gap: 0rem;
  align-content: start;
  border-top: 1px solid var(--cal-color-divider);
  font-size: var(--cal-content-font-size);

  &.today {
    .av-calendar-date {
      font-weight: bold;
      color: var(--cal-color-today);
    }
  }

  &:not(.sp-l) {
    .av-calendar-day-hints {
      padding-left: 0.25rem;
    }
  }

  &:not(.sp-r) {
    .av-calendar-day-hints {
      padding-right: 0.25rem;
    }
  }

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  &.hidden {
    visibility: hidden;
  }

  &.adjacent-month {
    opacity: 0.5;
  }

  .av-calendar-weekday {
    display: none;
    color: var(--cal-color-weekday);
    font-size: var(--cal-weekday-font-size);
  }

  .av-calendar-date {
    padding: 0.25rem 0.25rem 0;
    color: var(--cal-color-date);
    font-size: var(--cal-date-font-size);
  }

  .av-calendar-day-hints {
    display: flex;
    justify-content: stretch;
    column-gap: calc(2 * var(--cal-cell-padding));

    > span {
      display: inline-block;
      height: 4px;
      flex: 1 0;

      &.rotation {
        background-color: var(--tosync-color-rotation);
      }
      &.vol {
        background-color: var(--tosync-color-vol);
      }
      &.sv {
        background-color: var(--tosync-color-sv);
      }
      &.mep {
        background-color: var(--tosync-color-mep);
      }
      &.conges {
        background-color: var(--tosync-color-conges);
      }
      &.repos {
        background-color: var(--tosync-color-repos);
      }
      &.stage {
        background-color: var(--tosync-color-stage);
      }
      &.greve {
        background-color: var(--tosync-color-greve);
      }
      &.maladie {
        background-color: var(--tosync-color-maladie);
      }
      &.asbsence {
        background-color: var(--tosync-color-absence);
      }
      &.sanssolde {
        background-color: var(--tosync-color-sanssolde);
      }
      &.jisap {
        background-color: var(--tosync-color-jisap);
      }
      &.npl {
        background-color: var(--tosync-color-npl);
      }
      &.sol {
        background-color: var(--tosync-color-sol);
      }
      &.simu {
        background-color: var(--tosync-color-simu);
      }
      &.syndicat {
        background-color: var(--tosync-color-syndicat);
      }
      &.delegation {
        background-color: var(--tosync-color-delegation);
      }
      &.reserve {
        background-color: var(--tosync-color-reserve);
      }
      &.instructionSimu {
        background-color: var(--tosync-color-instructionSimu);
      }
      &.instructionSol {
        background-color: var(--tosync-color-instructionSol);
      }
      &.autre {
        background-color: var(--tosync-color-autre);
      }
      &.blanc {
        background-color: var(--tosync-color-blanc);
      }
      &.default {
        background-color: var(--tosync-color-default);
      }
    }
  }

  .d-start,
  .d-end {
    font-size: var(--cal-duty-time-font-size);
    font-family: var(--cal-font-mono);
  }

  .v-start,
  .v-end {
    font-size: var(--cal-time-font-size);
    font-family: var(--cal-font-mono);
  }

  .v-title {
    font-size: var(--cal-title-font-size);
  }

  .av-calendar-content {
    display: flex;
    flex: 1 1 100%;
    flex-flow: column nowrap;
    overflow-x: hidden;
    overflow-y: scroll;
    touch-action: pan-y;

    &::-webkit-scrollbar {
      display: none;
    }

    .av-calendar-event {
      margin-top: var(--cal-cell-padding);
      padding: 0 var(--cal-cell-padding);

      &.duty {
        padding: var(--cal-duty-padding);
        margin: var(--cal-cell-padding) var(--cal-cell-padding) 0;
      }
    }
  }
}
</style>
