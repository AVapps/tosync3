<template>
  <div>
    <div
      v-for="sv in filteredSVs"
      :key="sv._id"
      class="sv"
      :class="['events-count-' + sv?.events?.length, ...eventClass(sv, props.date)]"
    >
      <span class="d-start">{{ toTimeString(sv.start) }}</span>
      <div
        class="sv-event"
        v-for="etape in filterEventsByDate(sv.events, props.date)"
        :class="eventClass(etape, props.date)"
        :key="etape.slug"
      >
        <span class="v-title">
          <span class="v-num">{{ etape.num }}&nbsp;</span>
          <span class="v-from">{{ etape.from }}</span>
          <span class="v-divider">-</span>
          <span class="v-to">{{ etape.to }}</span>
        </span>
        <span class="v-start">{{ toTimeString(etape.std ?? etape.start) }}</span>
        <span class="v-end">{{ toTimeString(etape.sta ?? etape.end) }}</span>
      </div>
      <span class="d-end">{{ toTimeString(sv.end) }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { toTimeString } from '@/helpers/dates'
import { DateTime } from 'luxon'
import { eventClass, filterEventsByDate } from '@/helpers/calendar'

// eslint-disable-next-line
const props = defineProps({
  event: {
    type: Object,
    required: true
  },
  date: {
    type: DateTime,
    required: true
  }
})

const filteredSVs = computed(() => {
  return filterEventsByDate(props.event.sv, props.date)
})
</script>

<style lang="scss" scoped>
.av-calendar-event.rotation {
  font-family: 'DM Mono', 'SF Mono', monospace;
  display: grid;
  grid-template-columns: 100%;
  row-gap: var(--cal-cell-padding);

  .sv {
    display: grid;
    grid-template-columns: 100%;
    row-gap: var(--cal-event-row-gap);
    align-items: baseline;
    background-color: var(--tosync-color-rotation-duty-bg);
    color: var(--tosync-color-rotation-duty-text);
    padding: var(--cal-duty-padding);
    border-radius: var(--cal-duty-border-radius);
    contain: content;

    &.mep:not(.sp-l)::before {
      content: 'MEP';
      display: inline-block;
      vertical-align: middle;
      position: absolute;
      border-bottom-left-radius: var(--cal-duty-border-radius);
      background-color: var(--tosync-color-rotation-duty-bg);
      color: var(--tosync-color-rotation-duty-title);
      font-size: var(--cal-duty-time-font-size);
      font-style: italic;
      padding: 1px 2px 0px 4px;
      top: 0px;
      right: 0px;

      @media screen and (max-width: 549px) {
        font-size: 0.4rem;
        padding: 1px 1px 0px 2px;
      }

    }

    .d-start {
      opacity: 0.6;
    }

    .d-end {
      display: none;
    }

    &.sp-l > .d-start {
      display: none;
    }

    &.sp-r > .d-end {
      display: none;
    }

    .sv-event {
      display: grid;
      grid-template-columns: 1fr auto auto;
      align-items: baseline;
      gap: var(--cal-event-row-gap) 0.25rem;

      > span {
        display: inline-block;
        line-height: 1;
      }

      &.vol .v-title {
        > .v-from {
          font-weight: bold;
        }

        > .v-to {
          font-weight: bold;
        }
      }

      &.mep .v-title {
        > .v-from {
          font-style: italic;
        }

        > .v-to {
          font-style: italic;
        }
      }

      .v-title {
        font-family: var(--cal-font-mono);
        color: var(--tosync-color-rotation-duty-title);

        > * {
          display: inline-block;
        }

        > .v-num {
          display: inline-block;
          min-width: 7ch;
        }
      }

      > .v-start {
        justify-self: start;
      }

      > .v-end {
        opacity: 0.6;
      }

      &.sp-l > .v-start {
        opacity: 0;
      }
      &.sp-r > .v-end {
        opacity: 0;
      }
    }
  }

  @media screen and (max-width: 1320px) {
    .sv .sv-event .v-title > .v-num {
      display: none;
    }
  }

  @media screen and (max-width: 991px) {
    .sv {
      .sv-event {
        grid-template: 1em 0.75em / auto 1fr;

        > .v-title {
          grid-area: 1 / 1 / 2 / 3;
          align-self: end;
        }

        > .v-start {
          grid-area: 2 / 1 / 3 / 2;
        }

        > .v-end {
          display: inline-block;
          grid-area: 2 / 2 / 3 / 3;
        }
      }
    }
  }

  @media screen and (max-width: 549px) {
    .sv {
      .sv-event {
        grid-template: none;
        grid-template-columns: 100%;
        grid-auto-rows: 1em;

        .v-start,
        .v-end {
          display: none;
        }

        &:last-of-type .v-end {
          display: inline-block;
          grid-area: 2 / 1 / 3 / 2;
          justify-self: end;
        }
      }
    }
  }
}
</style>
