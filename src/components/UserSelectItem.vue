<template>
  <ion-card @click="setUser()" :button="true">
    <ion-avatar>
      <img v-if="userPhoto?.data" :src="`data:${userPhoto.content_type};base64,${userPhoto.data}`" />
      <ion-icon v-else :icon="personCircleOutline"/>
    </ion-avatar>
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
import { tryAndToastError } from '@/helpers/toast'
import { useMainStore, useUser } from '@/store'
import { useIonRouter } from '@ionic/vue'

// eslint-disable-next-line no-undef
const props = defineProps(['user'])
const store = useMainStore()
const userStore = useUser()
const router = useIonRouter()

const userPhoto = computed(() => props?.user?._attachments['photo.jpg'])

async function setUser() {
  router.push('/')
  userStore.setUser(props.user)
  await tryAndToastError(() => store.signIn({ silent: true }))
}

</script>

<style lang="scss" scoped>
ion-card {
  --avatar-size: 100px;
  --card-width: 182px;
  width: var(--card-width);
  background: transparent;

  ion-avatar {
    display: block;
    margin: 10px auto 0;
    height: var(--avatar-size);
    width: var(--avatar-size);
  }

  ion-icon {
    display: block;
    font-size: var(--avatar-size);
  }
}

</style>