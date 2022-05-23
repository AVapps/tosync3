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
    <ion-buttons class="header-buttons">
      <ion-button
        @click="signOut"
        color="theme"
        fill="clear"
        size="small">
        <ion-icon :icon="powerOutline" slot="icon-only"/>
      </ion-button>
    </ion-buttons>
  </ion-card-header>

  <ion-item lines="none" >
    <ion-spinner v-if="connect.isLoading" slot="start" />
    <ion-icon v-else
      class="connect-icon"
      :class="connect.isConnected && main.network.connected ? 'connected' : 'offline'"
      slot="start"
      :icon="ellipse" />
    
    <ion-text color="warning" v-if="!main.network.connected">Hors ligne</ion-text>
    <ion-text color="danger" v-else-if="!connect.isConnected">Déconnecté</ion-text>
    <ion-text color="success" v-else>Connecté</ion-text>
    
    <ion-buttons slot="end">
      <ion-button v-if="connect.isLoading" @click="connect.cancel()" fill="clear">
        <ion-icon :icon="stopCircleOutline" slot="icon-only"/>
      </ion-button>

      <ion-button v-if="connect.isConnected" id="modal-button" fill="clear">
        <ion-icon :icon="ellipsisHorizontalCircleOutline" slot="icon-only"/>
      </ion-button>
    </ion-buttons>
  </ion-item>

  <loading-button
    v-if="!connect.isConnected"
    @click="main.signIn({ silent: false })"
    :loading="connect.isLoading"
    :color="main.config.theme"
    fill="solid"
    class="connect-button"
  >
    <ion-text color="primary">Connexion</ion-text>
  </loading-button>

  <crew-connect-modal trigger="modal-button"/>
</ion-card>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useIonRouter } from '@ionic/vue'
import CrewConnectModal from './CrewConnectModal.vue'
import LoadingButton from './LoadingButton.vue'
import { ellipse, powerOutline, stopCircleOutline, ellipsisHorizontalCircleOutline } from 'ionicons/icons'
import { useUser, useConnect, useMainStore } from '@/store'
import { toLocaleString, DATETIME_SHORT_FORMAT } from '@/helpers/dates'

const router = useIonRouter()
const main = useMainStore()
const connect = useConnect()
const user = useUser()

const currentUserPhotoDataUrl = computed(() => {
  if (user.currentUser?._attachments['photo.jpg']) {
    const photo = user.currentUser?._attachments['photo.jpg']
    return `data:${photo.content_type};base64,${photo.data}`
  }
  return ''
})

const signOut = () => {
  router.push({ name: 'login' })
  main.signOut()
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
    grid-template: auto auto / auto 1fr auto;
    align-items: center;
    grid-gap: 0 20px;

    ion-avatar {
      grid-area: 1 / 1 / 3 / 2;
    }

    ion-card-title {
      grid-area: 1 / 2 / 2 / 3;
    }

    ion-card-subtitle {
      grid-area: 2 / 2 / 3 / 4;
    }

    ion-buttons.header-buttons {
      grid-area: 1 / 3 / 2 / 4;
      justify-content: end;
    }
  }

  ion-toolbar {
    --background: transparent;
  }
}

.connect-button {
  margin: 0 16px 16px;
}
</style>
