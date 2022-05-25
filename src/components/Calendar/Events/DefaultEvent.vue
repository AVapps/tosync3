<template>
  <div class="default">
    <span class="v-title" :class="'tosync-color-' + event.tag">
      {{ event.summary }}
    </span>
    <span class="v-start">{{ toTimeString(event.start) }}</span>
    <span class="v-end">{{ toTimeString(event.end) }}</span>
  </div>
</template>

<script setup>
import { toRefs } from 'vue'
import { toTimeString } from '@/helpers/dates'
import { tagLabel } from '@/helpers/events'

// eslint-disable-next-line no-undef
const props = defineProps(['event', 'date'])
const { event } = toRefs(props)
</script>

<style lang="scss" scoped>
.av-calendar-event.default {
  display: grid;
  grid-template: 1em 1em / 1fr auto;
  align-items: center;
  gap: var(--cal-event-row-gap) 0.25rem;

  > span {
    display: inline-block;
  }

  .v-title {
    font-weight: bold;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow-x: hidden;
    font-family: 'DM Sans', Roboto, sans-serif;
    grid-area: 1 / 1 / 2 / 2;
  }

  .v-start {
    grid-area: 1 / 2 / 2 / 3;
    justify-self: start;
    color: var(--cal-color-time);
  }

  .v-end {
    grid-area: 2 / 1 / 3 / 3;
    justify-self: end;
    opacity: 0.6;
    color: var(--cal-color-time);
  }

  &.sp-r > .v-end {
    opacity: 0;
  }

  &.sp-l > .v-start {
    opacity: 0;
  }

  @media screen and (max-width: 991px) {
    grid-template: 1em 1em 1em / 1fr;

    .v-title {
      grid-area: 2 / 1 / 3 / 2;
    }

    .v-start {
      grid-area: 1 / 1 / 2 / 2;
    }

    .v-end {
      grid-area: 3 / 1 / 4 / 2;
    }
  }
}
</style>
