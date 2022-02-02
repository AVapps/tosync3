<template>
  <div>
    <div
      v-for="sv in filteredSVs"
      :key="sv._id"
      class="sv"
      :class="'events-count-' + sv?.events?.length"
    >
      <span class="d-start">{{ tsToTime(sv.start) }}</span>
      <div class="sv-event" v-for="etape in sv.events" :key="etape.slug">
        <span class="v-title">
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

<script>
import { defineComponent, computed } from 'vue'
import { tsToTime } from '@/lib/helpers'

export default defineComponent({
  name: 'RotationEvent',
  props: ['event', 'date'],
  setup(props) {
    return {
      filteredSVs: computed(() => {
        const endOfDay = props.date.endOf('day')
        return props.event.sv.filter((sv) => {
          return sv.start < endOfDay && sv.end > props.date
        })
      }),
      tsToTime
    }
  }
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

    .d-start {
      opacity: 0.6;
    }

    .d-end {
      display: none;
    }

    .sv-event {
      display: grid;
      grid-template-columns: 1fr auto auto;
      align-items: baseline;
      gap: var(--cal-event-row-gap) 0.25rem;

      > span {
        line-height: 1;
      }

      .v-title {
        display: inline-block;
        font-family: var(--cal-font-mono);
        color: var(--tosync-color-rotation);

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
