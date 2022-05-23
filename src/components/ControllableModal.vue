<template>
  <ion-modal
    :is-open="modalOpenRef"
    @didDismiss="closeModal()"
  >
    <ion-page>
      <slot></slot>
    </ion-page>
  </ion-modal>
</template>

<script setup>
// eslint-disable-next-line no-undef
const modalOpenRef = ref(false)

function openModal() {
  modalOpenRef.value = true
}

function closeModal() {
  modalOpenRef.value = false
}

// eslint-disable-next-line no-undef
defineExpose({
  openModal,
  closeModal
})

</script>

<style lang="scss" scoped>
</style>