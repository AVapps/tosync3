<template>
<ion-card class="crew-connect-widget" color="transparent">
  <ion-card-header>
    <ion-avatar>
      <img v-if="user.userId" :src="currentUserPhotoDataUrl" />
      <ion-skeleton-text v-else animated />
    </ion-avatar>
    <ion-card-title>
      <template v-if="user.userId">{{ user.userId }}</template>
      <ion-skeleton-text v-else animated style="width: 3ch" />
    </ion-card-title>
    <ion-card-subtitle>
      <template v-if="user.userId">Dernière synchro. : {{ toLocaleString(main.lastPlanningSync, DATETIME_SHORT_FORMAT) }}</template>
      <ion-skeleton-text v-else animated style="width: 80%" />
    </ion-card-subtitle>
    <ion-button class="cc-logout"
      @click="signOut"
      color="theme"
      fill="clear"
      size="small">
      <ion-icon :icon="powerOutline" slot="icon-only"/>
    </ion-button>
  </ion-card-header>

  <ion-item lines="none">
    <ion-spinner v-if="loading" slot="start" />
    <ion-icon v-else
      class="connect-icon"
      :class="connect.isConnected && main.network.connected ? 'connected' : 'offline'"
      slot="start"
      :icon="ellipse" />
    <ion-text color="warning" v-if="!main.network.connected">Hors ligne</ion-text>
    <ion-text color="danger" v-else-if="!connect.isConnected">Déconnecté</ion-text>
    <ion-text color="success" v-else>Connecté</ion-text>
    <ion-buttons slot="end">
      <ion-button @click="silentSignIn" fill="clear">
        <ion-icon :icon="refreshOutline" slot="icon-only"/>
      </ion-button>
      <ion-button fill="clear">
        <ion-icon :icon="ellipsisHorizontalOutline" slot="icon-only"/>
      </ion-button>
    </ion-buttons>
  </ion-item>

  <ion-list v-if="!connect.isConnected && !connect.serverUrl" inset>
    <ion-item lines="none">
      <ion-input ref="serverUrlInput" type="url" placeholder="Adresse du serveur APM CrewConnect" :value="connect.serverUrl" />
    </ion-item>
  </ion-list>
  <ion-card-content v-if="!connect.isConnected" class="pt-0">
    <loading-button
      @click="onConnect()"
      :loading="loading"
      :color="main.config.theme"
      expand="block">
      Connexion
    </loading-button>
  </ion-card-content>
</ion-card>
</template>

<script setup>
import { refreshOutline, ellipse, ellipsisHorizontalOutline, powerOutline } from 'ionicons/icons'
import { ref, reactive, computed } from 'vue'
import { useUser, useConnect, useMainStore, useCrews } from '@/store'
import LoadingButton from './LoadingButton.vue'
import { toLocaleString, DATETIME_SHORT_FORMAT } from '@/helpers/dates'
import { toastError } from '@/helpers/toast'
import { asyncComputed } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { useIonRouter } from '@ionic/vue'

const router = useIonRouter()

const main = useMainStore()
const user = useUser()
const state = reactive({
  isLoading: false,
})

const connect = useConnect()
window.connect = connect
const crews = useCrews()

const currentUser = computed(() => user.currentUser)
const currentUserPhotoDataUrl = computed(() => {
  if (user.currentUser?._attachments['photo.jpg']) {
    const photo = user.currentUser?._attachments['photo.jpg']
    return `data:${photo.content_type};base64,${photo.data}`
  }
  return ''
})
const loading = computed(() => state.isLoading || connect.isLoading)

const serverUrlInput = ref(null)
const onConnect = async () => {
  try {
    if (serverUrlInput?.value) {
      const input = await serverUrlInput?.value.$el.getInputElement()
      if (input.value && input.reportValidity()) {
        console.log('Setting server url', input.value)
        connect.serverUrl = input.value
      }
    }
    if (!user.userId) {
      console.log('No user id, fetching user')
      await main.signIn({ silent: false })
    }
  } catch (e) {
    toastError(e)
    console.log(e)
  }
}

const silentSignIn = async () => {
  try {
    state.isLoading = true
    await main.signIn({ silent: true })
  } catch (e) {
    toastError(e)
    console.log(e, e.errorCode)
  } finally {
    state.isLoading = false
  }
}

const signOut = async () => {
  try {
    state.isLoading = true
    router.push({ name: 'login' })
    await main.signOut()
  } catch (e) {
    toastError(e)
    console.log(e, e.errorCode)
  } finally {
    state.isLoading = false
  }
}

const fetchEvents = async () => {
  try {
    state.isLoading = true
    const data = await connect.getRosterCalendars({
      dateFrom: '2022-04-01T00:00:00Z',
      dateTo: '2022-05-09T23:59:59Z'
    })
    console.log(data)
  } catch (e) {
    console.log(e, e.errorCode)
  } finally {
    state.isLoading = false
  }
  console.log(connect.unsignedActivities)  
}
</script>

<style lang="scss" scoped>
.connect-icon {
  color: var(--ion-color-danger);

  &.connected {
    color: var(--ion-color-primary);
  }
}
.chips-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.pt-0 {
  padding-top: 0;
}

.d-flex-center {
  display: flex;
  align-items: center;
}

ion-card {
  display: flex;
  flex-direction: column;

  ion-card-header {
    display: grid;
    grid-template: auto auto / auto 1fr;
    align-items: center;
    grid-gap: 0 20px;

    ion-avatar {
      grid-area: 1 / 1 / 3 / 2;
    }

    ion-card-title {
      grid-area: 1 / 2 / 2 / 3;
    }

    ion-card-subtitle {
      grid-area: 2 / 2 / 3 / 3;
    }
  }

  ion-toolbar {
    --background: transparent;
  }

  ion-button.cc-logout {
    position: absolute;
    top: 10px;
    right: 10px;
  }
}
</style>
