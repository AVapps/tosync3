<template>
  <ion-page>  
    <ion-content :fullscreen="true">
      <div id="calendar-wrapper">
        <calendar :display-mode="calendarMode"></calendar>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { IonContent, IonPage } from '@ionic/vue'
import Calendar from '@/components/Calendar/Calendar.vue'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Planning',
  components: {
    Calendar,
    IonContent,
    IonPage
  },
  data() {
    return {
      calendarMode: 'calendar'
    }
  }
})
</script>

<style lang="scss" scoped>
#calendar-wrapper {
  height: 100%;
  padding: 10px;
}
</style>