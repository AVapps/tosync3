<template>
  <template v-if="userId">
    <div id="userId">
      <div class="trigramme">
        <h1>{{ userId }}</h1>
      </div>
      <h4 class="nom">Adrien VERMEULEN</h4>
      <ion-button
        @click="signChanges()"
        fill="outline"
        shape="round"
        size="small"
        color="light"
      >
        Déconnexion
      </ion-button>
    </div>
  </template>
</template>

<script>
import { defineComponent } from 'vue'
import { useMainStore } from '@/store'

import {
  IonButton
} from '@ionic/vue'

export default defineComponent({
  name: 'UserSettings',
  components: {
    IonButton
  },
  setup() {
    const store = useMainStore()

    return {
      userId: 'IEN',
      user: store.user
    }
  }
})
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
