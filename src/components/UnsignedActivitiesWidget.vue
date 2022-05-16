<template>
  <Transition :css="false" @leave="leave">
    <ion-card ref="$card" v-if="connect.hasUnsignedActivities" class="unsigned-activities-widget">
      <ion-item lines="none" :button="true" @click="$modal.openModal()" :disabled="isLoading">
        <ion-spinner v-if="isLoading" slot="start"></ion-spinner>
        <ion-icon v-else slot="start" :icon="createOutline" />
        <ion-label>Activités non signées</ion-label>
        <ion-badge slot="end" color="warning">{{ connect.unsignedActivities?.length ?? 0 }}</ion-badge>
      </ion-item>
    </ion-card>
  </Transition>
  <unsigned-activities-modal
    ref="$modal"
    :activities="connect.unsignedActivities ?? []"
    @modal:confirm="signRoster()" />
</template>

<script setup>
import { createOutline } from 'ionicons/icons'
import { useConnect, useMainStore } from '@/store'
import { ref } from 'vue'
import { toastError } from '@/helpers/toast'
import { useMotion } from '@vueuse/motion'
import UnsignedActivitiesModal from './UnsignedActivitiesModal.vue'

const connect = useConnect()
const store = useMainStore()
const isLoading = ref(false)
const modalOpenRef = ref(false)
const $card = ref()
const $modal = ref()

const { leave } = useMotion($card, {
  initial: {
    opacity: 0,
    x: 100
  },
  enter: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring'
    }
  },
  leave: {
    opacity: 0,
    x: -100
  }
})

const signRoster = async () => {
  try {
    isLoading.value = true
    const resp = await connect.signRoster()
    console.log('signRoster', resp)
  } catch (e) {
    toastError(e)
    console.log(e, e.errorCode)
  } finally {
    isLoading.value = false
  }
}

</script>

<style lang="scss" scoped>
ion-card {
  border: 1px solid var(--ion-color-warning);
}
ion-item {
  --color: var(--ion-color-warning);
}
</style>