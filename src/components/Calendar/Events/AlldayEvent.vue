<template>
  <div :class="['tosync-bg-' + event.tag]">
    <span class="title">
      {{ tagLabel(event.tag) }}
    </span>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { tagLabel } from '@/lib/Utils'

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
  font-family: 'DM Sans', Roboto, sans-serif;

  &.span-left {
    .title {
      opacity: 0;
    }
  }
}
</style>
