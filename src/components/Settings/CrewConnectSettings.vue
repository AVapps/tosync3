<template>
  <ion-list inset>
    <ion-list-header>
      <ion-label>CrewConnect</ion-label>
    </ion-list-header>
    <ion-item @click="getServerUrl()" button>
      <ion-label>Serveur</ion-label>
      <ion-note>{{ connect.serverUrl }}</ion-note>
    </ion-item>
    <ion-item>
      <ion-label>Connexion auto</ion-label>
      <ion-toggle
        slot="end"
        @ion-change="mainStore.config.autoConnect = $event.detail.checked"
        :checked="mainStore.config.autoConnect"/>
    </ion-item>
  </ion-list>
</template>

<script setup>
import { useConnect, useMainStore } from '@/store'
import { useServerUrlPrompt } from '@/helpers/alert'

const connect = useConnect()
const mainStore = useMainStore()

const prompt = useServerUrlPrompt()

async function getServerUrl(message) {
  const { role, data } = await prompt({
    header: 'Adresse du serveur',
    value: connect.serverUrl,
    placeholder: 'https://adresse.du.serveur'
  })
  if (role === 'confirm' && data?.validatedUrl) {
    connect.serverUrl = data.validatedUrl
  }
}
</script>

<style lang="scss" scoped>

</style>