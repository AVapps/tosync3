<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div id="calendar-wrapper">
        <virtual-calendar :display-mode="calendarMode"></virtual-calendar>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { IonContent, IonPage } from '@ionic/vue'
import VirtualCalendar from '@/components/Calendar/VirtualCalendar.vue'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PlanningPage',
  components: {
    VirtualCalendar,
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