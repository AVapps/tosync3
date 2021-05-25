import { Events } from './Events'
import { reactive } from 'vue'
import { DateTime } from 'luxon'
import { getIntervalDates } from './utils'

export class EventsDatasource {
  constructor() {
    this.daysMap = reactive(new Map())
    this.subscribedMonths = new Set()
    this.locked = false
    this.tasks = []
  }

  async subscribe(userId, month) {
    if (!userId) throw new Error('No userId passed !')

    if (this.isLocked()) {
      this.tasks.push({
        type: 'subscribe',
        userId,
        month
      })
      return
    }

    this.lock()
    const isoMonth = month.toISODate().substring(0,7)
    console.log(`EventsDatasource.subscribe : ${ isoMonth }`)
    const key = this.getKey(userId, isoMonth)
    if (!this.subscribedMonths.has(key)) {
      await this.loadMonthEvents(userId, month)
      this.subscribedMonths.add(key)
    }
    this.unlock()
  }

  unsubscribe(userId, month) {
    if (!userId) throw new Error('No userId passed !')

    const isoMonth = month.toISODate().substring(0,7)
    const key = this.getKey(userId, isoMonth)
    if (this.subscribedMonths.has(key)) {
      if (this.isLocked()) {
        this.tasks.push({
          type: 'unsubscribe',
          userId,
          month
        })
        return
      }

      this.lock()
      console.log(`EventsDatasource.unsubscribe : ${ isoMonth }`)
      const prevMonthKey = this.getKey(userId, month.minus({ month: 1 }).toISODate().substring(0,7))
      const hasPrevMonth = this.subscribedMonths.has(prevMonthKey)
      const nextMonthKey = this.getKey(userId, month.plus({ month: 1 }).toISODate().substring(0,7))
      const hasNextMonth = this.subscribedMonths.has(nextMonthKey)
      const start = hasPrevMonth ? month.startOf('month').endOf('week').plus({ day: 1 }) : month.startOf('month').startOf('week')
      const end = hasNextMonth ? month.endOf('month').startOf('week').minus({ day: 1 }) : month.endOf('month').endOf('week')
      const dates = getIntervalDates(start, end)
      dates.forEach((date) => {
        this.daysMap.delete(this.getKey(userId, date))
      })
      const result = this.subscribedMonths.delete(isoDate)
      this.unlock()
      return result
    }
    return false
  }

  lock() {
    this.locked = true
  }

  unlock() {
    this.locked = false
    this.processTasks()
  }

  isLocked() {
    return this.locked
  }

  processTasks() {
    if (this.isLocked()) {
      return false
    }

    if (this.tasks.length) {
      const task = this.tasks.shift()
      
      const oppositeTaskIndex = this.tasks.findIndex(t => {
        return task.month.hasSame(t.month, 'month') && task.type === this._oppositeType(t.type)
      })

      if (oppositeTaskIndex !== -1) {
        this.tasks.splice(oppositeTaskIndex, 1)
        return this.processTasks()
      }

      switch (task.type) {
        case 'refresh':
          if (this.tasks.find(t => t.type === 'unsubscribe' && task.month.hasSame(t.month, 'month'))) {
            return this.processTasks()
          }
          this.refresh(task.userId, task.month)
            .catch((err) => {
              console.error(`Couldn't refresh events for : ${ task.userId } ${ task.month } !`)
              this.unlock()
            })
        case 'subscribe':
          this.subscribe(task.userId, task.month)
            .catch((err) => {
              console.error(`Couldn't download events for : ${ task.userId } ${ task.month } !`)
              this.unlock()
            })
        case 'unsubscribe':
          this.unsubscribe(task.userId, task.month)
      }
    }
    return true
  }

  _oppositeType(type) {
    switch (type) {
      case 'subscribe':
        return 'unsubscribe'
      case 'unsubscribe':
        return 'subscribe'
      case 'refresh':
        return null
      default:
        return type
    }
  }

  /**
   * 
   * @param {DateTime} month
   * @returns 
   */
  async refresh(userId, month) {
    if (!userId) throw new Error('No userId passed !')

    const isoMonth = month.toISODate().substring(0,7)
    const key = this.getKey(userId, isoMonth)

    if (!this.subscribedMonths.has(key)) {
      throw new Error('Passed month has not been already subscribed to !')
    }

    if (this.isLocked()) {
      this.tasks.push({
        type: 'refresh',
        userId,
        month
      })
      return
    }

    this.lock()
    const result = await this.loadMonthEvents(userId, month)
    this.unlock()
    return result
  }

  /**
   * 
   * @param {DateTime} month
   * @returns 
   */
  async loadMonthEvents(userId, month) {
    if (!userId) throw new Error('No userId passed !')

    const start = month
      .startOf('month')
      .startOf('week')
    const end = month
      .endOf('month')
      .endOf('week')

    console.time('loadMonthEvents')

    const events = await Events.getInterval(userId, start.valueOf(), end.valueOf())
    const map = new Map()

    console.log(userId, month.toISODate(), events)

    events.forEach(evt => {
      let cursor = DateTime.fromMillis(evt.start).startOf('day')
      while (cursor <= evt.end) {
        const iso = cursor.toISODate()
        if (map.has(iso)) {
          map.get(iso).push(evt)
        } else {
          map.set(iso, [evt])
        }
        cursor = cursor.plus({ day: 1 })
      }
    })

    const dates = getIntervalDates(start, end)
    dates.forEach((date) => {
      const key = this.getKey(userId, date)
      if (map.has(date)) {
        if (this.daysMap.has(key)) {
          this.daysMap.get(key).events = map.get(date)
        } else {
          this.daysMap.set(key, { date, events: map.get(date) })
        }
      } else {
        if (this.daysMap.has(key)) {
          this.daysMap.get(key).events = []
        }
      }
    })

    console.timeEnd('loadMonthEvents')
    return events
  }

  /**
   * 
   * @param {isoDate String} date 
   * @returns 
   */
  getDay(userId, date) {
    if (!userId) throw new Error('No userId passed !')
    return this.daysMap.get(this.getKey(userId, date))
  }

  getKey(userId, date) {
    if (!userId) throw new Error('No userId passed !')
    return [ userId, date ].join('.')
  }
}