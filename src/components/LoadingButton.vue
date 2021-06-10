<template>
  <ion-button :disabled="loading">
    <template v-if="loading">
      <ion-spinner />
    </template>
    <template v-else>
      <slot />
    </template>
  </ion-button>
</template>

<script>
import { defineComponent } from 'vue'
import { IonButton, IonSpinner } from '@ionic/vue'

export default defineComponent({
  name: 'LoadingButton',
  components: { IonButton, IonSpinner },
  props: { loading: Boolean },
  watch: {
    loading(newState) {
      if (this.$el && newState) {
        this.$el.style.minWidth = this.$el.offsetWidth + 'px'
      }
    }
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
