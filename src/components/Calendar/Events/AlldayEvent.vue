<template>
  <div :class="['tosync-color-' + event.tag]">
    <div class="allday-title">
      {{ tagLabel(event.tag) }}
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { tagLabel } from '@/helpers/events'

export default defineComponent({
  name: 'AlldayEvent',
  props: ['event', 'date'],
  setup() {
    return {
      tagLabel
    }
  }
})
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

  &.sp-l {
    .allday-title {
      opacity: 0;
    }
  }
}
</style>
