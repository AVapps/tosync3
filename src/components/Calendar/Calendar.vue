<template>
  <div class="av-calendar" :class="[displayMode, fadeCalendar]">
    <div class="av-calendar-header">
      <div class="datepicker">
        <h2 class="month-label" :class="{ fade: hideMonthLabel }">{{ currentMonthTitle }}</h2>
      </div>
      <div class="actions">
        <ion-button color="primary" fill="clear" size="small" @click="goToPrevMonth">
          <ion-icon :icon="chevronBack"></ion-icon>
        </ion-button>
        <ion-button color="primary" fill="clear" size="small" @click="goToPresentMonth">
          <ion-icon :icon="ellipseOutline"></ion-icon>
        </ion-button>
        <ion-button color="primary" fill="clear" size="small" @click="goToNextMonth">
          <ion-icon :icon="chevronForward"></ion-icon>
        </ion-button>
      </div>
    </div>
    <div class="av-calendar-body">
      <swiper
        @swiper="onSwiper"
        @slidePrevTransitionEnd="onSlidePrevTransitionEnd"
        @slideNextTransitionEnd="onSlideNextTransitionEnd"
        @slidePrevTransitionStart="hideMonthLabel = true"
        @slideNextTransitionStart="hideMonthLabel = true"
        :loop="true"
        :initial-slide="1"
        :space-between="10"
        :run-callbacks-on-init="false"
      >
        <swiper-slide v-for="(slide, index) in slides" :key="index">
          <calendar-month :displayedMonth="slide.displayedMonth"></calendar-month>
        </swiper-slide>
      </swiper>
    </div>
  </div>
</template>

<script>
import { IonButton, IonIcon } from '@ionic/vue'
import { chevronBack, chevronForward, ellipseOutline } from 'ionicons/icons'

import { reactive, computed, ref, onMounted, nextTick } from 'vue'

import CalendarMonth from './CalendarMonth'

import { DateTime } from 'luxon'
import { WEEKDAYS } from './utils'

import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/swiper.scss'

window.DateTime = DateTime

export default {
  name: 'Calendar',
  components: {
    CalendarMonth,
    IonIcon,
    IonButton,
    SwiperSlide,
    Swiper
  },
  props: ['displayMode'],
  setup() {
    const today = DateTime.local()

    const months = reactive({
      prevMonth: today.startOf('month').minus({ month: 1 }),
      currentMonth: today.startOf('month'),
      nextMonth: today.startOf('month').plus({ month: 1 })
    })

    const slides = reactive([
      {
        displayedMonth: months.prevMonth,
      },
      {
        displayedMonth: months.currentMonth,
      },
      {
        displayedMonth: months.nextMonth,
      }
    ])

    const currentMonthTitle = computed(() => {
      return months.currentMonth.toLocaleString({ year: 'numeric', month: 'long' })
    })
    const hideMonthLabel = ref(false)

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
          swiper.update()
        }, 250)
      }
    })

    const fadeCalendar = ref('')

    const onSlidePrevTransitionEnd = (sw) => {
      console.log('ON SLIDE PREV END', sw.realIndex)
      if (!swiper) return
      months.nextMonth = months.currentMonth
      months.currentMonth = months.prevMonth
      hideMonthLabel.value = false
      months.prevMonth = months.prevMonth.minus({ month: 1 })
      let prevIndex = sw.realIndex - 1
      if (prevIndex < 0) {
        prevIndex = 2
      }
      slides[prevIndex].displayedMonth = months.prevMonth
    }

    const onSlideNextTransitionEnd = (sw) => {
      console.log('ON SLIDE NEXT END', sw.realIndex)
      if (!swiper) return
      months.prevMonth = months.currentMonth
      months.currentMonth = months.nextMonth
      hideMonthLabel.value = false
      months.nextMonth = months.nextMonth.plus({ month: 1 })
      let nextIndex = sw.realIndex + 1
      if (nextIndex > 2) {
        nextIndex = 0
      }
      slides[nextIndex].displayedMonth = months.nextMonth
    }

    const goToPrevMonth = () => {
      if (swiper) swiper.slidePrev()
    }

    const goToPresentMonth = async () => {
      const currentMonth = today.startOf('month')
      months.prevMonth = today.startOf('month').minus({ month: 1 })
      months.nextMonth = today.startOf('month').plus({ month: 1 })
      fadeCalendar.value = 'fade'
      if (swiper) {
        swiper.slideToLoop(1, 300, false)
        slides[0].displayedMonth = months.prevMonth
        slides[1].displayedMonth = currentMonth
        slides[2].displayedMonth = months.nextMonth
      }
      setTimeout(async () => {
        months.currentMonth = currentMonth
        await nextTick()
        fadeCalendar.value = ''
      }, 300)
    }

    const goToNextMonth = () => {
      if (swiper) swiper.slideNext()
    }

    return {
      onSwiper,
      onSlidePrevTransitionEnd,
      onSlideNextTransitionEnd,
      fadeCalendar,
      months,
      slides,
      currentMonthTitle,
      hideMonthLabel,
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

<style lang="scss" scoped>
  .av-calendar {
    height: 100%;
    display: grid;
    grid-template: auto 1fr / 100%;
    padding: var(--ion-safe-area-top) var(--ion-safe-area-right) 0 var(--ion-safe-area-left);
    overflow-x: visible;
    transition: opacity 0.15s ease-in;

    &.fade {
      opacity: 0.0;
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
            opacity: 0.0;
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



