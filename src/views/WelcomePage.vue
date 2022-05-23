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
            <ion-button fill="clear" @click="swiper.slideNext()">
              Continuer
            </ion-button>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div class="slide-content">
            <div>
              <ion-icon :icon="personAddOutline" />
            </div>
            <h1>Commencez par vous connecter</h1>
            <ion-list inset>
              <ion-item :class="errorMessage ? 'ion-invalid' : ''" :disabled="isLoading">
                <ion-label position="stacked">Adresse du serveur</ion-label>
                <ion-input
                  ref="urlInput"
                  type="url"
                  clear-input
                  v-model="serverUrl"
                  inputmode="url"
                  placeholder="https://adresse.du.serveur"/>
              </ion-item>
            </ion-list>
            <ion-note v-if="errorMessage" color="danger">
              {{ errorMessage }}
            </ion-note>
            <ion-note v-else>
              Entrez l'adresse du serveur CrewConnect à utiliser.<br>
              Une fois enregistrée, celle-ci peut être modifiée dans les réglages de l'application.
            </ion-note>
            <loading-button
              fill="solid"
              @click="lastSlideNextClicked()"
              :loading="isLoading"
              class="ion-margin-top">
              Connexion
            </loading-button>
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
import LoadingButton from '@/components/LoadingButton.vue'
import { useIonRouter } from '@ionic/vue'
import { useConnect, useMainStore, useUser } from '@/store'
import { validateURL } from '@/helpers/check'

const router = useIonRouter()
const slideOpts = {
  initialSlide: 0,
  speed: 400,
  centeredSlides: true
}

const mainStore = useMainStore()
const connect = useConnect()
const user = useUser()
const isLoading = ref(false)
const serverUrl = ref('https://crewmobile.to.aero')
const errorMessage = ref()

const swiper = ref(null)
const onSwiper = sw => {
  swiper.value = sw
}

async function lastSlideNextClicked() {
  errorMessage.value = ''
  if (!serverUrl.value) {
    errorMessage.value = "Vous devez entrer une adresse https valide"
    return
  }
  const validatedUrl = validateURL(serverUrl.value)
  if (!validatedUrl) {
    errorMessage.value = "Vous devez entrer une adresse https valide"
    return
  }
  connect.serverUrl = validatedUrl
  isLoading.value = true
  await mainStore.signIn({ silent: false })
  if (mainStore.error) {
    errorMessage.value = mainStore.error?.error ?? mainStore.error?.message
  }
  if (user.userId) {
    mainStore.config.firstUse = false
    mainStore.config.autoConnect = true
    router.push({ name: 'home' })
  }
  isLoading.value = false
}
</script>

<style scoped lang="scss">
.slide-content {
  display: grid;
  grid-template-columns: minmax(max-content, 600px);
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

ion-item {
  --background: var(--ion-color-light);
  [data-theme=dark] & {
    --background: var(--ion-color-dark);
  }
}
</style>
