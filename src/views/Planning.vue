<template>
  <ion-page>  
    <ion-content :fullscreen="true">
      <div id="calendar-wrapper">
        <calendar v-model="date"></calendar>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { IonContent, IonPage } from '@ionic/vue'
import { Calendar } from 'v-calendar'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Home',
  components: {
    Calendar,
    IonContent,
    IonPage
  },
  data() {
    return {
      date: new Date(),
    }
  }
})
</script>

<style lang="scss" scoped>
#calendar-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
}
</style>