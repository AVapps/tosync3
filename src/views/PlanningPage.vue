<template>
  <ion-page>
    <virtual-calendar :display-mode="calendarMode"></virtual-calendar>
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
    IonPage
  },
  data() {
    return {
      calendarMode: 'calendar'
    }
  }
})
</script>

<style lang="scss">
</style>