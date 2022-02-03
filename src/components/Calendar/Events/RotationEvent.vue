<template>
  <div>
    <div
      v-for="sv in filteredSVs"
      :key="sv._id"
      class="sv"
      :class="['events-count-' + sv?.events?.length, ...eventClass(sv, props.date)]"
    >
      <span class="d-start">{{ tsToTime(sv.start) }}</span>
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
        <span class="v-start">{{ tsToTime(etape.std ?? etape.start) }}</span>
        <span class="v-end">{{ tsToTime(etape.sta ?? etape.end) }}</span>
      </div>
      <span class="d-end">{{ tsToTime(sv.end) }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { tsToTime } from '@/lib/helpers'
import { DateTime } from 'luxon'
import { eventClass, filterEventsByDate } from '../utils'

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
    padding: var(--cal-duty-padding);

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

      .v-title {
        font-family: var(--cal-font-mono);
        color: var(--tosync-color-rotation);

        > .v-num {
          display: inline-block;
          min-width: 7ch;
        }

        > .v-from {
          font-weight: bold;
        }

        > .v-to {
          font-weight: bold;
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
        grid-template: 1em 1em / auto 1fr;

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
