<template>
  <template v-if="user.userId">
    <div id="userId">
      <div class="trigramme">
        <h1>{{ user.userId }}</h1>
      </div>
      <h4 class="nom">{{ user.profile.name }}</h4>
      <ion-button fill="outline" shape="round" size="small" color="light">
        Déconnexion
      </ion-button>
    </div>
  </template>
</template>

<script setup>
import { useUser } from '@/store'
import {
  IonButton
} from '@ionic/vue'

const user = useUser()
</script>

<style lang="scss" scoped>
#userId {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .trigramme {
    display: grid;
    place-content: center;
    width: 6rem;
    height: 6rem;
    background-color: var(--ion-color-primary);
    border-radius: 100%;

    > h1 {
      margin: 0;
    }
  }
}
</style>
