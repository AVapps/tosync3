<template>
  <div :class="['tosync-color-' + props.event.tag]">
    <div class="allday-title">
      {{ tagLabel(props.event.tag) }}
    </div>
  </div>
</template>

<script setup>
import { tagLabel } from '@/helpers/events'

// eslint-disable-next-line no-undef
const props = defineProps(['event', 'date'])
</script>

<style lang="scss" scoped>
.av-calendar-event.allday {
  display: block;
  text-align: center;
  text-transform: uppercase;
  font-weight: bold;

  .allday-title {
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .av-calendar-day.sp-l &{
    .allday-title {
      opacity: 0;
    }
  }
}
</style>
