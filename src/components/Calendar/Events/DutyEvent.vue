<template>
  <div class="duty">
    <div class="d-start">{{ tsToTime(event.start) }}</div>
    <div v-for="evt in event.events" :key="evt.slug" class="duty-event">
      <span class="v-title" :class="'tosync-color-' + evt.tag">
        {{ evt.summary }}
      </span>
      <span class="v-start">{{ tsToTime(evt.start) }}</span>
      <span class="v-end">{{ tsToTime(evt.end) }}</span>
    </div>
    <div class="d-end">{{ tsToTime(event.end) }}</div>
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
  row-gap: var(--cal-event-row-gap);
  margin: 0 var(--call-cell-padding);
  padding: var(--cal-duty-padding);
  background-color: var(--tosync-color-sol-duty-bg);

  .d-start {
    display: none;
    opacity: 0.6;

    .simu &,
    .simuInstruction & {
      display: inline-block;
    }
  }

  .d-end {
    opacity: 0.6;
    text-align: right;
  }

  &.sp-r {
    .d-end {
      opacity: 0;
    }
  }

  &.sp-l {
    .d-start {
      opacity: 0;
    }
  }

  > .duty-event {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: baseline;
    gap: var(--cal-event-row-gap) 0.25rem;

    > span {
      display: inline-block;
    }

    .v-title {
      font-weight: bold;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow-x: hidden;
    }

    .v-start {
      justify-self: start;
    }

    .v-end {
      display: none;
      justify-self: end;
      opacity: 0.6;
    }
  }

  @media screen and (max-width: 991px) {
    > .d-start {
      display: inline-block;
    }

    > .d-end {
      display: inline-block;
    }

    > .duty-event {
      grid-template-columns: 1fr;

      > .v-start,
      > .v-end {
        display: none;
      }
    }
  }

  &.rotation,
  &.vol,
  &.sv,
  &.mep {
    background-color: var(--tosync-color-rotation-duty-bg);
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
}
</style>
