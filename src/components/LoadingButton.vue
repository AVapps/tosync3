<template>
  <component :is="props.componentType === 'chip' ? IonChip : IonButton" :disabled="props.loading" ref="button">
    <template v-if="props.loading">
      <ion-spinner
        :color="$attrs.fill === 'outline' || props.componentType === 'chip' ? $attrs.color : undefined"
        name="crescent"
        />
    </template>
    <template v-else>
      <slot />
    </template>
  </component>
</template>

<script setup>
import { ref, watchEffect, onMounted } from 'vue'
import { IonButton, IonSpinner, IonChip } from '@ionic/vue'

// eslint-disable-next-line no-undef
const props = defineProps({
  loading: {
    type: Boolean,
    default: false 
  },
  componentType: {
    type: String,
    default: 'button'
  }
})

const button = ref(null)
let el = null

onMounted(() => {
  el = button.value?.$el
})

watchEffect(() => {
  if (el?.style && props.loading) {
    el.style.minWidth = el.offsetWidth + 'px'
  }
})
</script>

<style lang="scss" scoped>
.p-button {
  text-align: center;

  > .loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }
}
</style>
