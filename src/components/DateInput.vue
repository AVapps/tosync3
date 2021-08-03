<template>
  <div class="ts-date-input">
    <input
      type="date"
      class="ion-text-right"
      :value="date"
      @change="dateChanged"
      :min="min"
      :max="max"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'DateInput',
  props: {
    modelValue: String,
    min: Number,
    max: Number
  },
  emits: ['update:modelValue'],
  computed: {
    date() {
      return this.modelValue
    }
  },
  methods: {
    dateChanged(evt) {
      this.$emit('update:modelValue', evt.currentTarget.value)
    }
  }
})
</script>

<style lang="scss" scoped>
.ts-date-input {
  input {
    -webkit-appearance: none;
    outline: none;
    text-align: right;
    border: none;
    background: transparent;
    color: var(--ion-color-primary);
  }

  input::-webkit-date-and-time-value {
    margin: 0;
  }
}
</style>
