<template>
  <ion-page>
    <ion-content fullscreen="true" scroll-y="false">
      <Swiper
        @swiper="onSwiper"
        :initial-slide="0"
        :centered-slides="true"
        :observer="true"
      >
        <SwiperSlide>
          <div class="slide-content">
            <ion-icon :icon="syncOutline" />
            <h1>
              Bienvenue dans l'application
              <ion-text color="primary">TO.sync</ion-text>
            </h1>
            <p>
                TO.sync se connecte au serveur CrewConnect pour télécharger et
                synchroniser votre planning !
            </p>
            <ion-button fill="clear" @click="swiper.slideNext()">
              Continuer
            </ion-button>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div class="slide-content">
            <ion-icon :icon="lockClosedOutline" />
            <h1>Gardez la main sur vos données personnelles !</h1>
            <p>
              Votre planning est sauvegardé uniquement dans votre tablette ou smartphone et reste disponible hors connexion.
            </p>
            <ion-button fill="clear" @click="swiper.slideNext()">
              Continuer
            </ion-button>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div class="slide-content">
            <div>
              <ion-icon :icon="syncOutline" />
              <ion-icon :icon="calendarOutline" />
            </div>
            <h1>Synchronisation améliorée</h1>
            <p>
              Vous pouvez synchroniser directement votre planning avec un ou plusieurs calendriers de votre tablette ou smartphone.
            </p>
            <ion-button fill="clear" @click="lastSlideNextClicked">
              Continuer
            </ion-button>
          </div>
        </SwiperSlide>
      </Swiper>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  syncOutline,
  lockClosedOutline,
  calendarOutline,
  personAddOutline
} from 'ionicons/icons'

import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMainStore } from '@/store'

const router = useRouter()
const slideOpts = {
  initialSlide: 0,
  speed: 400,
  centeredSlides: true
}

const store = useMainStore()

const swiper = ref(null)
const onSwiper = sw => {
  swiper.value = sw
}

function lastSlideNextClicked() {
  store.firstUse = false
  router.push({ name: 'login' })
}
</script>

<style scoped lang="scss">
.slide-content {
  display: grid;
  place-content: center;
  text-align: center;
  padding: 2rem;
  height: 100vh;

  ion-icon {
    font-size: 128px;
    color: var(--ion-color-primary);
    place-self: center;
  }
}
</style>
