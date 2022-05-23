import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { IonicVue, isPlatform } from '@ionic/vue'
import { createPinia } from 'pinia'

import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

/* Theme variables */
import './theme/variables.css'
import './theme/calendar.css'

/* Global Styles */
import './style.scss'

const app = createApp(App)
  .use(IonicVue, {
    mode: isPlatform('android') ? 'md' : 'ios'
  })
  .use(createPinia())
  .use(router)

app.component('RecycleScroller', RecycleScroller)

router.isReady().then(() => {
  app.mount('#app')
})

import { DateTime } from 'luxon'
window.DateTime = DateTime

window.addEventListener('unhandledrejection', function (event) {
  console.log('[ Unhandled Rejection ]', event.reason, event)
  event.preventDefault()
})