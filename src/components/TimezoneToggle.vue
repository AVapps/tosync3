<template>
  <ion-toggle color="tertiary"></ion-toggle>
</template>

<script setup>
import { IonToggle } from '@ionic/vue'
</script>

<style lang="scss" scoped>
ion-toggle {
    width: 90px;
    --handle-width: 40px;

    &::before {
      position: absolute;
      color: white;
      top: 8px;
      left: 10px;
      content: "UTC";      
      font-size: 0.75rem;
      font-weight: bold;
      z-index: 1;
    }

    &::after {
      position: absolute;
      top: 8px;
      right: 10px;
      content: "Paris";      
      font-size: 0.75rem;
      font-weight: bold;
      z-index: -1;
    }
  }
</style>