<template>
  <ion-page>
    <ion-content fullscreen="true" scroll-y="false">
      <swiper
        @swiper="onSwiper"
        :initial-slide="0"
        :centered-slides="true"
        :observer="true"
      >
        <swiper-slide>
          <div class="slide-content">
            <ion-icon :icon="syncOutline" />
            <h1>
              Bienvenue dans l'application
              <ion-text color="primary">TO.sync</ion-text>
            </h1>
            <p>
              <ion-text color="light">
                TO.sync utilise dorénavant CrewWebPlus pour télécharger et
                synchroniser votre planning !
              </ion-text>
            </p>
            <ion-button fill="clear" @click="swiper.slideNext()">
              Continuer
            </ion-button>
          </div>
        </swiper-slide>
        <swiper-slide>
          <div class="slide-content">
            <ion-icon :icon="lockClosedOutline" />
            <h1>Gardez la main sur vos données personnelles !</h1>
            <p>
              <ion-text color="light">
                Votre planning est sauvegardé uniquement dans votre tablette ou
                smartphone et reste disponible hors connexion.
              </ion-text>
            </p>
            <ion-button fill="clear" @click="swiper.slideNext()">
              Continuer
            </ion-button>
          </div>
        </swiper-slide>
        <swiper-slide>
          <div class="slide-content">
            <div>
              <ion-icon :icon="syncOutline" />
              <ion-icon :icon="calendarOutline" />
            </div>
            <h1>Synchronisation améliorée</h1>
            <p>
              <ion-text color="light">
                Vous pouvez synchroniser directement votre planning avec un ou
                plusieurs calendriers de votre tablette ou smartphone.
              </ion-text>
            </p>
            <ion-button fill="clear" @click="swiper.slideNext()">
              Continuer
            </ion-button>
          </div>
        </swiper-slide>
        <swiper-slide>
          <div class="slide-content">
            <ion-icon :icon="personAddOutline" />
            <h1>Commencez par vous connecter à CrewWebPlus</h1>
            <crew-web-widget :mini="true" @login="onLogin" />
          </div>
        </swiper-slide>
      </swiper>
    </ion-content>
  </ion-page>
</template>

<script>
import { IonButton, IonContent, IonIcon, IonPage, IonText } from '@ionic/vue'
import {
  syncOutline,
  lockClosedOutline,
  calendarOutline,
  personAddOutline
} from 'ionicons/icons'

import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/swiper.scss'

import CrewWebWidget from '@/components/CrewWebWidget'
import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'Welcome',
  components: {
    IonButton,
    IonContent,
    IonIcon,
    IonPage,
    SwiperSlide,
    Swiper,
    IonText,
    CrewWebWidget
  },
  setup() {
    const router = useRouter()
    const slideOpts = {
      initialSlide: 0,
      speed: 400,
      centeredSlides: true
    }

    const swiper = ref(null)
    const onSwiper = sw => {
      console.log('SWIPER')
      swiper.value = sw
    }

    onMounted(() => {
      setTimeout(() => {
        swiper.value.update()
      }, 500)
    })

    return {
      onLogin: () => {
        console.log('LOGIN')
        router.push('/tabs')
      },
      onSwiper,
      swiper,
      slideOpts,
      syncOutline,
      lockClosedOutline,
      calendarOutline,
      personAddOutline
    }
  }
})
</script>

<style scoped lang="scss">
.swiper-container {
  height: 100vh;
  width: 100%;

  .swiper-slide {
    .slide-content {
      display: grid;
      place-content: center;
      text-align: center;
      padding: 2rem;
      height: 100%;

      ion-icon {
        font-size: 128px;
        color: var(--ion-color-primary);
        place-self: center;
      }
    }
  }
}
</style>
