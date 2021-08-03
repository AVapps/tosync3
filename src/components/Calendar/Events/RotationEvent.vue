<template>
  <div>
    <div
      v-for="sv in filteredSVs"
      :key="sv._id"
      class="sv"
      :class="'events-count-' + sv?.events?.length"
    >
      <span class="sv-start">{{ tsToTime(sv.start) }}</span>
      <div class="sv-event" v-for="etape in sv.events" :key="etape.slug">
        <span class="bullet">&#8226;</span>
        <span class="v-start">{{ tsToTime(etape.start) }}</span>
        <span class="v-num">{{ etape.num }}</span>
        <span class="v-from">{{ etape.from }}</span>
        <span class="v-to">{{ etape.to }}</span>
        <span class="v-end">{{ tsToTime(etape.end) }}</span>
      </div>
      <span class="sv-end">{{ tsToTime(sv.end) }}</span>
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
        return props.event.sv.filter(sv => {
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
  display: grid;
  grid-template-columns: 100%;
  grid-row-gap: 0.25rem;
  background-color: var(--tosync-color-rotation);

  .sv {
    display: grid;
    grid-template-columns: 100%;
    grid-row-gap: 0.25rem;
    padding: 0.2rem;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 0.25rem;

    .sv-start {
      opacity: 0.8;
      font-size: 0.5625rem;
    }

    .sv-end {
      display: none;
      opacity: 0.8;
      justify-self: end;
      font-size: 0.5625rem;
    }

    .sv-event {
      display: grid;
      grid-template-columns: 1ch auto 1fr 1fr auto;
      gap: 0 0.2rem;

      > span {
        line-height: 0.75rem;
        font-size: 0.625rem;
      }

      > .bullet {
        font-weight: bold;
        font-size: 1rem;
        margin-left: -1px;
      }

      > .v-start {
        justify-self: start;
        font-size: 0.5625rem;
      }

      > .v-num {
        display: none;
      }

      > .v-from {
        font-weight: bold;
        justify-self: end;
      }

      > .v-to {
        font-weight: bold;
        justify-self: start;
      }

      > .v-end {
        justify-self: end;
        font-size: 0.5625rem;
      }
    }
  }

  @media screen and (max-width: 991px) {
    .sv {
      .sv-event {
        grid-template-columns: 1ch auto auto 1fr;

        > .v-end {
          display: none;
        }
      }
    }
  }

  @media screen and (max-width: 799px) {
    .sv {
      .sv-event {
        grid-template: 0.75rem 0.75rem / 1ch auto 1fr;

        > .bullet {
          grid-area: 1 / 1 / 3 / 2;
          align-self: center;
        }

        > .v-start {
          grid-area: 1 / 2 / 2 / 4;
        }

        > .v-from {
          grid-area: 2 / 2 / 3 / 3;
          justify-self: start;
        }

        > .v-to {
          grid-area: 2 / 3 / 3 / 4;
        }
      }

      &:not(.events-count-1) {
        .sv-event:last-of-type {
          > .v-start {
            display: none;
          }

          > .v-from {
            grid-area: 1 / 2 / 2 / 3;
            justify-self: start;
          }

          > .v-to {
            grid-area: 1 / 3 / 2 / 4;
          }

          > .v-end {
            display: inline-block;
            grid-area: 2 / 2 / 3 / 4;
            justify-self: start;
          }
        }
      }
    }
  }

  @media screen and (max-width: 599px) {
  }
}
</style>
