<template>
  <div class="av-calendar" :class="[displayMode]">
    <div class="av-calendar-header">
      <div class="datepicker">
        <h2 class="month-label">
          <input type="month" :value="isoMonth" @change="onMonthSelect" />
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
        @transitionEnd="onTransitionEnd"
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
import { reactive, ref, onMounted, nextTick, provide } from 'vue'
import { IonButton, IonIcon } from '@ionic/vue'
import { chevronBack, chevronForward, ellipseOutline } from 'ionicons/icons'

import SwiperCore, { Virtual } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/swiper.scss'

import CalendarMonth from './CalendarMonth'

import { DateTime } from 'luxon'
import { WEEKDAYS } from './utils'
import { useEventsDatasource } from '@/lib/useEventsDatasource'

SwiperCore.use([Virtual])
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
    const datasource = useEventsDatasource()
    provide('datasource', datasource)
    window.EventsData = datasource

    const today = DateTime.local()
    const currentMonth = today.startOf('month')

    const monthsList = []
    let d = today.startOf('month').minus({ year: 1 })
    const endOfCalendar = today.startOf('month').plus({ months: 2 })

    while (d <= endOfCalendar) {
      monthsList.push(d)
      d = d.plus({ month: 1 })
    }

    const slides = reactive(
      monthsList.map((month) => ({
        month,
        isCurrent: month.hasSame(currentMonth, 'month'),
        isPast: month < currentMonth,
        isFuture: month > currentMonth,
        subscribed: false
      }))
    )

    const activeMonthLabel = ref(
      currentMonth.toLocaleString({
        year: 'numeric',
        month: 'long'
      })
    )

    const isoMonth = ref(currentMonth.toISODate().substring(0, 7))

    const currentSlide = () => {
      return slides.findIndex((s) => s.isCurrent)
    }

    const onActiveIndexChange = (sw) => {
      const month = slides[sw.activeIndex]?.month
      activeMonthLabel.value = month?.toLocaleString({
        year: 'numeric',
        month: 'long'
      })
      isoMonth.value = month?.toISODate().substring(0, 7)
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

    const goToPrevMonth = () => {
      if (swiper) swiper.slidePrev()
    }

    const goToPresentMonth = () => {
      if (swiper) {
        swiper.slideTo(currentSlide(), 300, false)
      }
    }

    const goToMonth = (monthDT) => {
      if (swiper) {
        const index = slides.findIndex((s) => s.month.hasSame(monthDT, 'month'))
        if (index !== -1) {
          swiper.slideTo(index, 300, false)
        }
      }
    }

    const goToNextMonth = () => {
      if (swiper) swiper.slideNext()
    }

    const onMonthSelect = (e) => {
      const month = DateTime.fromISO(e.target.value)
      goToMonth(month)
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

    // TODO : implement global state
    const state = {
      userId: 'IEN',
      isPNT: true
    }

    async function subscribe(slide) {
      const monthString = slide.month.toISODate().substring(0, 7)
      console.log(
        '%cSUBSCRIBING...',
        'font-weight:bold',
        state.userId,
        monthString
      )
      try {
        await datasource.subscribeMonth(state.userId, monthString, state.isPNT)
      } catch (e) {
        // TODO : handle error
        console.log(e)
      }
      slide.subscribed = true
      console.log('%cSUBSCRIBED', 'font-weight:bold', state.userId, monthString)
    }

    async function unsubscribe(slide) {
      if (!slide.subscribed) return
      const monthString = slide.month.toISODate().substring(0, 7)
      console.log(
        '%cUNSUBSCRIBING...',
        'font-weight:bold',
        state.userId,
        monthString
      )
      try {
        await nextTick()
        await datasource.unsubscribeMonth(state.userId, monthString)
      } catch (err) {
        console.log(err)
      }
      slide.subscribed = false
      console.log(
        '%cUNSUBSCRIBED',
        'font-weight:bold',
        state.userId,
        monthString
      )
    }

    return {
      onSwiper,
      onActiveIndexChange,
      onTransitionEnd,
      onMonthSelect,
      slides,
      isoMonth,
      activeMonthLabel,
      initialSlide: currentSlide(),
      goToPrevMonth,
      goToPresentMonth,
      goToNextMonth,
      weekdays: WEEKDAYS,
      chevronBack,
      chevronForward,
      ellipseOutline
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

      input[type='month'] {
        text-transform: capitalize;
        padding: 0;
        outline: none;
        border: none;
        background-image: none;
        background-color: transparent;
        -webkit-box-shadow: none;
        -moz-box-shadow: none;
        box-shadow: none;
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
