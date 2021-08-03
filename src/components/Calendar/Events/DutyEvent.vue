<template>
  <div class="duty">
    <span class="duty-start">{{ tsToTime(event.start) }}</span>
    <ul>
      <li v-for="evt in event.events" :key="evt.slug" class="duty-event">
        <span class="bullet" :class="'tosync-color-' + evt.tag">&#8226;</span>
        <span class="v-start">{{ tsToTime(evt.start) }}</span>
        <span class="v-summary">{{ evt.summary }}</span>
        <span class="v-end">{{ tsToTime(evt.end) }}</span>
      </li>
    </ul>
    <span class="duty-end">{{ tsToTime(event.end) }}</span>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { tsToTime } from '@/lib/helpers'
import { tagLabel } from '@/lib/Utils'

export default defineComponent({
  name: 'DutyEvent',
  props: ['event', 'date'],
  setup() {
    return {
      tsToTime,
      tagLabel
    }
  }
})
</script>

<style lang="scss" scoped>
.av-calendar-event.duty {
  display: grid;
  grid-template-columns: 100%;
  grid-row-gap: 0.25rem;
  padding: 0.2rem 0.25rem;
  border-radius: 0.5rem;
  background-color: rgba(var(--tosync-color-sol), 0.5);
  font-size: 0.625rem;

  .duty-start {
    opacity: 0.8;
    font-size: 0.5625rem;
  }

  .duty-end {
    opacity: 0.8;
    font-size: 0.5625rem;
    text-align: right;
  }

  &.span-right {
    .duty-end {
      opacity: 0;
    }
  }

  &.span-left {
    .duty-start {
      opacity: 0;
    }
  }

  > ul {
    list-style: none;
    margin: 0;
    padding: 0;

    > li.duty-event {
      display: grid;
      grid-template-columns: 1ch auto 1fr auto;
      gap: 0.2rem;

      > span {
        display: inline-block;
        line-height: 0.75rem;
      }

      > .bullet {
        font-weight: bold;
        font-size: 1rem;
        margin-left: -2px;
      }

      .v-start {
        justify-self: start;
        font-size: 0.5625rem;
      }

      .v-num {
        display: none;
      }

      .v-summary {
        font-weight: bold;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow-x: hidden;
        font-family: 'DM Sans', Roboto, sans-serif;
      }

      .v-end {
        justify-self: end;
        font-size: 0.5625rem;
      }
    }
  }

  @media screen and (max-width: 991px) {
    > ul {
      list-style: none;
      margin: 0;
      padding: 0;

      > li.duty-event {
        grid-template-columns: 1ch 1fr;

        > .v-start,
        > .v-end {
          display: none;
        }
      }
    }
  }

  &.rotation,
  &.vol,
  &.sv,
  &.mep {
    background-color: var(--tosync-color-rotation-duty-bg);
  }

  &.conges {
    background-color: var(--tosync-color-conges-duty-bg);
  }

  &.repos {
    background-color: var(--tosync-color-repos-duty-bg);
  }

  &.stage {
    .av-calendar-badge {
      background-color: var(--tosync-color-stage-duty-bg);
    }
  }

  &.maladie,
  &.greve,
  &.absence,
  &.sanssolde,
  &.jisap,
  &.npl {
    background-color: var(--tosync-color-maladie-duty-bg);
  }

  &.sol,
  &.simu,
  &.syndicat,
  &.delegation,
  &.reserve,
  &.instructionSimu,
  &.instructionSol {
    background-color: var(--tosync-color-sol-duty-bg);
  }

  &.autre {
    background-color: var(--tosync-color-autre-duty-bg);
  }

  &.blanc {
    background-color: var(--tosync-color-blanc-duty-bg);
  }

  &.npl {
    background-color: var(--tosync-color-npl-duty-bg);
  }
}
</style>
