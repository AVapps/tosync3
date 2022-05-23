<template>
  <ion-card @click="setUser()" :button="true" :disabled="connect.isLoading">
    <ion-avatar>
      <img v-if="userPhoto?.data" :src="`data:${userPhoto.content_type};base64,${userPhoto.data}`" />
      <ion-icon v-else :icon="personCircleOutline"/>
    </ion-avatar>
    <ion-spinner class="loading-spinner" :class="connect.isLoading ? 'show' : ''" name="crescent" />
    <ion-card-header>
      <ion-card-title class="ion-text-center">{{ props.user?._id }}</ion-card-title>
      <ion-card-subtitle class="ion-text-center">
        {{ props.user?.firstName }} {{ props.user?.lastName }}
      </ion-card-subtitle>
    </ion-card-header>
  </ion-card>
</template>

<script setup>
import { personCircleOutline } from 'ionicons/icons'
import { useConnect, useMainStore, useUser } from '@/store'
import { useIonRouter } from '@ionic/vue'

// eslint-disable-next-line no-undef
const props = defineProps(['user'])
const mainStore = useMainStore()
const connect = useConnect()
const userStore = useUser()
const router = useIonRouter()

const userPhoto = computed(() => props?.user?._attachments['photo.jpg'])

async function setUser() {
  userStore.setUser(props.user)
  await mainStore.signIn({ silent: true })
  router.push('/')
}

</script>

<style lang="scss" scoped>
ion-card {
  --avatar-size: 120px;
  --card-width: 200px;

  background: transparent;
  box-shadow: none;

  &::part(native) {
    display: grid;
    grid-template: var(--avatar-size) auto / var(--card-width);
  }

  ion-avatar, ion-spinner.loading-spinner {
    grid-area: 1 / 1 / 2 / 2;
    display: block;
    margin: 10px auto 0;
    padding: 10px;
    height: var(--avatar-size);
    width: var(--avatar-size);
  }

  ion-spinner.loading-spinner {
    background: rgba(255,255,255,0.5);
    backdrop-filter: blur(3px);
    opacity: 0;
    transition: opacity 0.5s ease;

    [data-theme=dark] & {
      background: rgba(0,0,0,0.5);
    }

    &.show {
      opacity: 1;
    }
  }

  ion-icon {
    display: block;
    font-size: var(--avatar-size);
  }

  ion-card-header {
    grid-area: 2 / 1 / 3 / 2;
  }
}
</style>