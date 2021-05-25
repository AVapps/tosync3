<template>
  <div class="default">
    <span class="bullet" :class="'tosync-color-' + event.tag">&#8226;</span>
    <span class="v-start">{{ tsToTime(event.start) }}</span>
    <span class="v-summary">{{ event.summary }}</span>
    <span class="v-end">{{ tsToTime(event.end) }}</span>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { tsToTime } from '@/lib/helpers'
import { tagLabel } from '@/lib/Utils'

export default defineComponent({
  name: 'DefaultEvent',
  props: ['event'],
  setup() {
    return {
      tsToTime,
      tagLabel
    }
  }
})
</script>

<style lang="scss" scoped>
.av-calendar-event.default {
  display: grid;
  grid-template-columns: 1ch auto 1fr auto;
  align-items: center;
  gap: 0.2rem;
  padding: 0.2rem 0 !important;
  font-size: 0.625rem;

  > * {
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

  @media screen and (max-width: 991px) {
    grid-template-columns: 1ch auto 1fr;

    .v-end {
      display: none;
    }
  }

  @media screen and (max-width: 799px) {
    grid-template: 0.75rem 0.75rem / 1ch auto 1fr;

    > .bullet {
      grid-area: 1 / 1 / 3 / 2;
    }

    .v-start {
      grid-area: 1 / 2 / 2 / 4;
    }

    .v-summary {
      grid-area: 2 / 2 / 3 / 4;
    }
  }

  @media screen and (max-width: 575px) {
  }
}
</style>