<template>
  <div class="hs-widget">
    <ion-chip
      class="ehs"
      :outline="true"
      :color="ehs < 0 ? 'tertiary' : 'success'"
    >
      eHS {{ formatNumber(ehs, { alwaysDisplaySign: true }) }}
    </ion-chip>
    <ion-chip
      class="hdv"
      :outline="true"
      color="secondary"
    >
      HDV {{ formatAsHours(hdv) }}
    </ion-chip>
  </div>
</template>

<script setup>
import { IonChip } from '@ionic/vue'
import { formatNumber, formatAsHours } from '@/lib/helpers'

// eslint-disable-next-line no-undef
const props = defineProps({
  ehs: {
    type: Number,
    required: true
  },
  hdv: {
    type: Number,
    required: true
  }
})

</script>

<style lang="scss" scoped>
.hs-widget {
  display: flex;
  flex-flow: row nowrap;
}
</style>