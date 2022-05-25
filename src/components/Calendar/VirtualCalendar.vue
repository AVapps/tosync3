<template>
  <ion-content class="av-calendar" :class="[displayMode]" fullscreen :scroll-y="false">
    <div class="av-calendar-header" slot="fixed">
      <month-picker
        :month="isoMonth"
        :min="MIN_MONTH"
        :max="MAX_MONTH"
        @update:month="onMonthSelect"/>
      <hs-widget :ehs="-4.35" :hdv="63.5" />
    </div>
    <div class="av-calendar-body">
      <Swiper
        @swiper="onSwiper"
        @activeIndexChange="onActiveIndexChange"
        @transitionEnd="onTransitionEnd"
        :virtual="true"
        :initial-slide="presentSlide()"
        :space-between="10"
        :updateOnWindowResize="true"
        :run-callbacks-on-init="false"
        :observer="true"
      >
        <SwiperSlide
          v-for="(slide, index) in slides"
          :key="index"
          :virtualIndex="index"
        >
          <calendar-month :month="slide.month"></calendar-month>
        </SwiperSlide>
      </Swiper>
    </div>
  </ion-content>
</template>

<script setup>
import { reactive, ref, onMounted, nextTick, provide } from 'vue'
import { IonContent } from '@ionic/vue'
import SwiperCore, { Virtual } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import HsWidget from './HSWidget.vue'
import MonthPicker from './MonthPicker.vue'
import CalendarMonth from './CalendarMonth'
import { DateTime } from 'luxon'
import { WEEKDAYS } from '@/helpers/calendar'
import { usePlanning, useUser } from '@/store'
import { toastError } from '@/helpers/toast'


SwiperCore.use([Virtual])
window.DateTime = DateTime

// eslint-disable-next-line no-undef
defineProps(['displayMode'])

const planning = usePlanning()
window.planning = planning

const today = DateTime.local()
const presentMonth = today.startOf('month')

const MIN_MONTH = '2010-01'
const endOfCalendar = today.startOf('month').plus({ months: 3 })
const MAX_MONTH = endOfCalendar.toISODate().substring(0, 7)
const monthsList = []
let d = DateTime.fromISO(MIN_MONTH)

while (d <= endOfCalendar) {
  monthsList.push(d)
  d = d.plus({ month: 1 })
}

const slides = reactive(
  monthsList.map((month) => ({
    month,
    isPresent: month.hasSame(presentMonth, 'month'),
    isPast: month < presentMonth,
    isFuture: month > presentMonth,
    subscribed: false
  }))
)

const isoMonth = ref(presentMonth.toISODate().substring(0, 7))

const presentSlide = () => {
  return slides.findIndex((s) => s.isPresent)
}

let swiper
const onSwiper = (sw) => {
  console.log('SWIPER')
  swiper = sw
}

onMounted(() => {
  console.log('MOUNTED')
  // Fix wrong width calculation of swiper
  if (swiper) {
    setTimeout(async () => {
      await nextTick()
      console.log('Swiper.update')
      swiper.update(true)
    }, 500)
  }
})

// Month change triggered by swiper
const onActiveIndexChange = (sw) => {
  const month = slides[sw.activeIndex]?.month
  // console.log('onActiveIndexChange', month)
  isoMonth.value = month?.toISODate().substring(0, 7)
}

// Month change triggered by month picker
const onMonthSelect = (iso) => {
  const month = DateTime.fromISO(iso)
  goToMonth(month)
}

const goToMonth = (monthDT) => {
  if (swiper) {
    const index = slides.findIndex((s) => s.month.hasSame(monthDT, 'month'))
    if (index !== -1) {
      swiper.slideTo(index, 300, false)
    }
  }
}

const onTransitionEnd = () => {
  console.log('TRANSITION END')
  if (swiper) {
    const toSubscribeIndex = [
      swiper.virtual.from,
      swiper.activeIndex,
      swiper.virtual.to
    ]
    
    for (const index of toSubscribeIndex) {
      const slide = slides[index]
      if (slide && !slide.subscribed) {
        subscribe(slide)
      }
    }

    slides.forEach((slide, index) => {
      if (!toSubscribeIndex.includes(index) && slide.subscribed) {
        unsubscribe(slide)
      }
    })
  }
}

async function subscribe(slide) {
  const monthString = slide.month.toISODate().substring(0, 7)
  console.log(
    '%cSUBSCRIBING...',
    'font-weight:bold',
    monthString
  )
  try {
    await planning.subscribeMonth(monthString)
  } catch (error) {
    toastError(error)
    console.log(error)
  }
  slide.subscribed = true
  console.log('%cSUBSCRIBED', 'font-weight:bold', monthString)
}

async function unsubscribe(slide) {
  if (!slide.subscribed) return
  const monthString = slide.month.toISODate().substring(0, 7)
  console.log(
    '%cUNSUBSCRIBING...',
    'font-weight:bold',
    monthString
  )
  try {
    await nextTick()
    await planning.unsubscribeMonth(monthString)
  } catch (error) {
    toastError(error)
    console.log(error)
  }
  slide.subscribed = false
  console.log(
    '%cUNSUBSCRIBED',
    'font-weight:bold',
    monthString
  )
}
</script>

<style lang="scss">
ion-content.av-calendar {
  display: grid;
  width: 100vw;
  height: 100%;
  grid-template: auto 1fr / 100%;
  overflow-x: visible;
  transition: opacity 0.15s ease-in;
  --padding-start: 10px;
  --padding-end: 10px;

  &::part(scroll)::-webkit-scrollbar {
    display: none;
  }

  &::-webkit-scrollbar {
    display: none;
  }
  

  &.fade {
    opacity: 0;
    transform: translateX(0);
    transition: opacity 0.15s ease-out;
  }

  .av-calendar-header {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    align-items: center;
    padding-left: max(10px, var(--ion-safe-area-left));
    padding-top: var(--ion-safe-area-top);
    padding-right: max(10px, var(--ion-safe-area-right));
    width: 100vw;
    background-color: rgba(var(--ion-background-color-rgb), 0.7);
    backdrop-filter: blur(4px);
    z-index: 10;
  }

  .av-calendar-body {
    .swiper-container {
      height: 100%;
    }
  }
}
</style>
