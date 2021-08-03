<template>
  <div class="ts-number-input">
    <ion-icon
      :icon="removeCircleOutline"
      @click="decr()"
      :style="{ opacity: number == min ? 0.3 : 1 }"
    />
    <ion-input
      type="number"
      v-model="number"
      readonly="true"
      :min="min"
      :max="max"
      step="1"
      :pattern="`[${min}-${max}]`"
    />
    <ion-icon
      :icon="addCircleOutline"
      @click="incr()"
      :style="{ opacity: number == max ? 0.3 : 1 }"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { IonIcon, IonInput } from '@ionic/vue'
import { addCircleOutline, removeCircleOutline } from 'ionicons/icons'

export default defineComponent({
  name: 'NumberInput',
  components: {
    IonIcon,
    IonInput
  },
  props: {
    modelValue: Number,
    min: Number,
    max: Number
  },
  emits: ['update:modelValue'],
  data() {
    return {
      number: this.modelValue || 0,
      addCircleOutline,
      removeCircleOutline
    }
  },
  methods: {
    incr() {
      if (this.number < this.$props.max) {
        this.number++
        this.$emit('update:modelValue', this.number)
      }
    },
    decr() {
      if (this.number > this.$props.min) {
        this.number--
        this.$emit('update:modelValue', this.number)
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.ts-number-input {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;

  ion-icon {
    font-size: 24px;
  }

  ion-input {
    text-align: center;
    min-width: 3ch;

    :deep(input) {
      margin: 0;
      padding: 0;

      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
        padding: 0;
      }
    }
  }
}
</style>
