<template>
  <Transition :css="false" @leave="leave">
    <ion-card ref="$card" class="roster-changes-widget" v-if="connect.hasChanges">
      <ion-item lines="none" :button="true" @click="$modal.openModal()" :disabled="isLoading">
        <ion-spinner v-if="isLoading" slot="start"></ion-spinner>
        <ion-icon v-else slot="start" :icon="mailUnreadOutline" />
        <ion-label>Modifications à valider</ion-label>
        <ion-badge slot="end" color="danger">{{ connect.changes?.workSpaceRosterChangeDtos.length }}</ion-badge>
      </ion-item>
    </ion-card>
  </Transition>
  <roster-changes-modal
    ref="$modal"
    :changes="connect.changes?.workSpaceRosterChangeDtos"
    @modal:confirm="signRosterChanges()" />
</template>

<script setup>
import { mailUnreadOutline } from 'ionicons/icons'
import { useConnect } from '@/store'
import { ref } from 'vue'
import { toastError } from '@/helpers/toast'
import { useMotion } from '@vueuse/motion'
import RosterChangesModal from './RosterChangesModal.vue'

const connect = useConnect()
const isLoading = ref(false)
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

const signRosterChanges = async () => {
  isLoading.value = true
  try {
    const resp = await connect.signRosterChanges()
    console.log('signRosterChanges', resp)
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
  border: 1px solid var(--ion-color-danger);
}
ion-item {
  --color: var(--ion-color-danger);
}
</style>