<template>
  <div class="av-calendar" :class="[displayMode]">
    <div class="av-calendar-header">
      <div class="datepicker">
        <h2 class="month-label">
          {{ activeMonthLabel }}
        </h2>
      </div>
      <div class="actions">
        <ion-button
          color="primary"
          fill="clear"
          size="small"
          @click="goToPrevMonth"
        >
          <ion-icon :icon="chevronBack"></ion-icon>
        </ion-button>
        <ion-button
          color="primary"
          fill="clear"
          size="small"
          @click="goToPresentMonth"
        >
          <ion-icon :icon="ellipseOutline"></ion-icon>
        </ion-button>
        <ion-button
          color="primary"
          fill="clear"
          size="small"
          @click="goToNextMonth"
        >
          <ion-icon :icon="chevronForward"></ion-icon>
        </ion-button>
      </div>
    </div>
    <div class="av-calendar-body">
      <swiper
        @swiper="onSwiper"
        @activeIndexChange="onActiveIndexChange"
        :virtual="true"
        :initial-slide="initialSlide"
        :space-between="10"
        :updateOnWindowResize="true"
        :run-callbacks-on-init="false"
        :observer="true"
      >
        <swiper-slide
          v-for="(slide, index) in slides"
          :key="index"
          :virtualIndex="index"
        >
          <calendar-month :month="slide.month"></calendar-month>
        </swiper-slide>
      </swiper>
    </div>
  </div>
</template>

<script>
import { IonButton, IonIcon } from '@ionic/vue'
import { chevronBack, chevronForward, ellipseOutline } from 'ionicons/icons'

import SwiperCore, { Virtual } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/swiper.scss'
SwiperCore.use([Virtual])

import {
  reactive,
  ref,
  onMounted,
  nextTick,
  provide,
  onBeforeUpdate
} from 'vue'

import CalendarMonth from './CalendarMonth'

import { DateTime } from 'luxon'
import { WEEKDAYS } from './utils'
import { EventsDatasource } from '@/model/EventsDatasource'

window.DateTime = DateTime

export default {
  name: 'VirtualCalendar',
  components: {
    CalendarMonth,
    IonIcon,
    IonButton,
    SwiperSlide,
    Swiper
  },
  props: ['displayMode'],
  setup() {
    const eventsSource = new EventsDatasource()
    provide('datasource', eventsSource)
    window.EventsData = eventsSource

    const today = DateTime.local()
    const currentMonth = today.startOf('month')

    const monthsList = []
    let d = today.startOf('month').minus({ year: 1 })
    const endOfCalendar = today.startOf('month').plus({ months: 2 })

    while (d <= endOfCalendar) {
      monthsList.push(d)
      d = d.plus({ month: 1 })
    }

    const slidesComponents = ref([])

    onBeforeUpdate(() => {
      slidesComponents.value = []
    })

    const slides = reactive(
      monthsList.map(month => ({
        month,
        isCurrent: month.hasSame(currentMonth, 'month'),
        isPast: month < currentMonth,
        isFuture: month > currentMonth
      }))
    )

    const activeMonthLabel = ref(
      currentMonth.toLocaleString({
        year: 'numeric',
        month: 'long'
      })
    )

    const currentSlide = () => {
      return slides.findIndex(s => s.isCurrent)
    }

    const onActiveIndexChange = sw => {
      activeMonthLabel.value = slides[sw.activeIndex]?.month?.toLocaleString({
        year: 'numeric',
        month: 'long'
      })
    }

    // const isBusy = ref(false)

    // const onTransitionStart = sw => {
    //   isBusy.value = true
    //   console.log('onTransitionStart')
    // }

    // const onTransitionEnd = sw => {
    //   isBusy.value = false
    //   console.log('onTransitionEnd', slidesComponents.value)
    // }

    let swiper
    const onSwiper = sw => {
      console.log('SWIPER')
      swiper = sw
    }

    onMounted(() => {
      console.log('MOUNTED')
      // Fix wrong width calculation of swiper
      if (swiper) {
        setTimeout(async () => {
          await nextTick()
          swiper.update()
        }, 1000)
      }
    })

    const goToPrevMonth = () => {
      if (swiper) swiper.slidePrev()
    }

    const goToPresentMonth = async () => {
      const _currentMonth = today.startOf('month')
      if (swiper) {
        swiper.slideTo(currentSlide(), 300, false)
      }
    }

    const goToNextMonth = () => {
      if (swiper) swiper.slideNext()
    }

    return {
      onSwiper,
      onActiveIndexChange,
      // onTransitionStart,
      // onTransitionEnd,
      slides,
      // slidesComponents,
      activeMonthLabel,
      initialSlide: currentSlide(),
      goToPrevMonth,
      goToPresentMonth,
      goToNextMonth,
      weekdays: WEEKDAYS,
      chevronBack,
      chevronForward,
      ellipseOutline
      // isBusy
    }
  }
}
</script>

<style lang="scss">
.av-calendar {
  height: 100%;
  display: grid;
  grid-template: auto 1fr / 100%;
  padding: var(--ion-safe-area-top) var(--ion-safe-area-right) 0
    var(--ion-safe-area-left);
  overflow-x: visible;
  transition: opacity 0.15s ease-in;

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
    padding-bottom: 1rem;

    .datepicker {
      .month-label {
        color: var(--ion-color-success);
        font-weight: bold;
        text-transform: capitalize;
        margin: 0;
        transition: opacity 0.15s ease-in, transform 0.15s ease-in;

        &.fade {
          opacity: 0;
          transform: translateX(-5px);
          transition: opacity 0.15s ease-out, transform 0.15s ease-out;
        }
      }
    }

    .actions {
      ion-button::part(native) {
        --padding-start: 5px;
        --padding-end: 5px;
      }
    }
  }

  .av-calendar-body {
    .swiper-container {
      height: 100%;
    }
  }
}
</style>



