<template>
  <ion-modal
    @didDismiss="closeModal()"
    :is-open="modalOpenRef" 
    :presenting-element="$parent.$refs.ionRouterOutlet"
    :can-dismiss="true"
    swipe-to-close >
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="secondary" @click="onResetClick()">
            <ion-button>Réinitialiser</ion-button>
          </ion-buttons>
          <ion-buttons slot="primary" @click="onConfirmClick()">
            <ion-button>Ok</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content fullscreen>
        <ion-list inset>
          <ion-item slot="header">
            <ion-label>Trier par</ion-label>
          </ion-item>
          <ion-radio-group slot="content" v-model="filters.sortBy" allow-empty-selection>
            <ion-item>
              <ion-label>Nom</ion-label>
              <ion-radio slot="start" value="lastName"></ion-radio>
            </ion-item>
            <ion-item>
              <ion-label>Prénom</ion-label>
              <ion-radio slot="start" value="firstName"></ion-radio>
            </ion-item>
            <ion-item>
              <ion-label>Trigramme</ion-label>
              <ion-radio slot="start" value="crewCode"></ion-radio>
            </ion-item>
          </ion-radio-group>
        </ion-list>
        <ion-list inset>
          <ion-item slot="header">
            <ion-label>Filtrer</ion-label>
            <ion-button @click="filters.roles.clear()" slot="end" fill="clear">
              Effacer
            </ion-button>
          </ion-item>
          <ion-list slot="content">
            <ion-item v-for="role in roles" :key="role">
              <ion-checkbox
                slot="start"
                :modelValue="filters.roles.has(role)"
                @update:modelValue="$event ? filters.roles.add(role) : filters.roles.delete(role)">
              </ion-checkbox>
              <ion-label>{{ role }}</ion-label>
            </ion-item>
          </ion-list>
        </ion-list>
      </ion-content>
    </ion-page>
  </ion-modal>
</template>

<script setup>
import { reactive, toRaw } from 'vue'

// eslint-disable-next-line no-undef
const props = defineProps(['roles'])

const filters = reactive({
  sortBy: 'lastName',
  roles: new Set()
})


// eslint-disable-next-line no-undef
const emit = defineEmits(['modal:close', 'modal:confirm'])

const modalOpenRef = ref(false)

function openModal() {
  modalOpenRef.value = true
}

function closeModal() {
  modalOpenRef.value = false
}

function onCloseClick() {
  closeModal()
  emit('modal:close')
}

function onConfirmClick() {
  closeModal()
  const rawFilters = toRaw(filters)
  const result = {
    roles: [...rawFilters.roles]
  }

  switch (rawFilters.sortBy) {
    case 'lastName':
      result.sortBy = ['lastName', 'firstName']
      break
    case 'firstName':
      result.sortBy = ['firstName', 'lastName']
      break
    case 'crewCode':
      result.sortBy = ['_id', 'lastName', 'firstName']
      break
  }
  
  emit('modal:confirm', result)
}

function onResetClick() {
  filters.sortBy = 'lastName'
  filters.roles.clear()
}

// eslint-disable-next-line no-undef
defineExpose({
  openModal,
  closeModal
})

</script>

<style lang="scss" scoped>

</style>