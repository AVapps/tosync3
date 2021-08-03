<template>
  <ion-slides pager="true" :options="slideOpts">
    <ion-slide>
      <h1>Slide 1</h1>
    </ion-slide>
    <ion-slide>
      <h1>Slide 2</h1>
    </ion-slide>
    <ion-slide>
      <h1>Slide 3</h1>
    </ion-slide>
  </ion-slides>
</template>

<script>
import { IonSlides, IonSlide } from '@ionic/vue'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'WelcomeSlides',
  components: { IonSlides, IonSlide },
  setup() {
    const slideOpts = {
      initialSlide: 1,
      speed: 400
    }
    return { slideOpts }
  }
})
</script>
