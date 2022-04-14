<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="centered-content">
        <h1>TO.sync</h1>
        <ion-spinner name="crescent" color="primary"></ion-spinner>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonContent,
  IonSpinner
} from '@ionic/vue'
</script>

<style lang="scss" scoped>
.centered-content {
  display: grid;
  height: 100vh;
  place-content: center;

  > ion-spinner {
    height: 5rem;
    width: 5rem;
  }
}
</style>