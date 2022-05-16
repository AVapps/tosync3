import { SimpleEventEmitter } from '@/lib/EventEmitter'
import { DateTime, Interval } from 'luxon'
import { checkUserId, checkISOMonth } from '@/helpers/check'
import { remuForMonth } from '@/lib/Remu/Remu'
import { calculSalaireAF } from '@/lib/Remu/calculSalairePNT'
import { EventsDatasource } from './EventsDatasource2'

const TIMEZONE = 'Europe/Paris'

// TODO: observer les modifications d'évènements et de jours pour mettre à jour les stats
export class PlanningDatasource extends EventsDatasource {
  constructor() {
    super()
    this._months = new Map()
    this._monthsSubs = new Map()
  }

  async subscribeMonth({ userId, isPNT = false }, isoMonth) {
    checkUserId(userId)
    checkISOMonth(isoMonth)
    const month = DateTime.fromISO(isoMonth, { zone: TIMEZONE })
    const interval = this.constructor.getIntervalForMonth(month)

    console.log(`%cMonthsDatasource.subscribeMonth%c : ${userId}-${isoMonth}`, 'color:green', 'color:inherit')

    if (!this._months.has(userId)) {
      this._months.set(userId, new Map())
    }

    const { events, days, sub } = await this.subscribeInterval({ userId, isPNT }, interval.start, interval.end)

    const userMonths = this._months.get(userId)
    if (!userMonths.has(isoMonth)) {
      const monthSub = {
        month: isoMonth,
        interval,
        isPNT,
        data: {
          stats: {},
          salaire: {},
        },
        count: 1
      }
      if (events && days) {
        monthSub.data.stats = remuForMonth(month, events, days, isPNT)
        monthSub.data.salaire = calculSalaireAF(monthSub.data.stats)
        console.log(`%cremuMois ${isoMonth}`, 'color:pink', monthSub.data.stats, monthSub.data.salaire)
      }
      userMonths.set(isoMonth, monthSub)
    } else {
      const monthSub = userMonths.get(isoMonth)
      monthSub.count++
    }
    return isoMonth
  }

  async unsubscribeMonth(userId, isoMonth) {
    checkUserId(userId)
    checkISOMonth(isoMonth)
    const month = DateTime.fromISO(isoMonth, { zone: TIMEZONE })
    const intervalKey = this.constructor.getIntervalForMonth(month).toISODate()

    await this.unsubscribe(userId, intervalKey)
    
    if (!this._months.has(userId)) {
      throw new Error('User has no months subscriptions !')
    }

    const userMonths = this._months.get(userId)
    if (!userMonths.has(isoMonth)) {
      throw new Error(`Passed month (${isoMonth}) has not been already subscribed to !`)
    }

    const monthSub = userMonths.get(isoMonth)
    if (monthSub.count > 1) {
      monthSub.count--
    } else {
      userMonths.delete(isoMonth)
    }
  }

  // Static helpers
  static getIntervalForMonth(month) {
    const start = month
      .startOf('month')
      .startOf('week')
    const end = month
      .endOf('month')
      .endOf('week')
    
    return Interval.fromDateTimes(start, end)
  }
}