import * as Comlink from 'comlink'
import { DateTime } from 'luxon'
import { reactive } from 'vue'
import { checkUserId } from '@/helpers/check'
import { toISOMonth } from '@/helpers/dates'

export class EventsDatasourceClient {
  constructor () {
    const worker = new Worker(new URL('./EventsWorker.js', import.meta.url))
    this.datasource = Comlink.wrap(worker)
    this.daysMap = reactive(new Map())
    this.eventsIndex = reactive(new Map())
    this._watch = false
    this._watchersReady = false
    this.watchDatasource()
  }

  watchDatasource() {
    this._watch = true
    if (!this._watchersReady) {
      this.datasource.on('events.set', Comlink.proxy(this.setEvents.bind(this)))
      this.datasource.on('events.remove', Comlink.proxy(this.removeEvents.bind(this)))
      this.datasource.on('days.set', Comlink.proxy(this.setDays.bind(this)))
      this.datasource.on('days.remove', Comlink.proxy(this.removeDays.bind(this)))
      this._watchersReady = true
    }
  }

  unwatchDatasource() {
    this._watch = false
  }

  // this.emit('events.set', { events })
  setEvents({ events }) {
    if (!this._watch) return
    console.log('EventsDatasourceClient.setEvents', events)
    events.forEach(evt => this.eventsIndex.set(evt._id, evt))
  }

  // this.emit('events.remove', { ids })
  removeEvents({ ids }) {
    if (!this._watch) return
    console.log('EventsDatasourceClient.removeEvents', ids)
    ids.forEach(_id => this.eventsIndex.delete(_id))
  }

  // this.emit('days.set', { userId, days })
  setDays({ userId, days }) {
    if (!this._watch) return
    console.log('EventsDatasourceClient.setDays', userId, days)
    if (!userId) throw new Error('No userId passed !')
    days.forEach(day => this.daysMap.set(this.constructor.getKey(userId, day.date), day))
  }

  // this.emit('days.remove', { userId, dates })
  removeDays({ userId, dates }) {
    if (!this._watch) return
    console.log('EventsDatasourceClient.removeDays', userId, dates)
    if (!userId) throw new Error('No userId passed !')
    dates.forEach(date => this.daysMap.delete(this.constructor.getKey(userId, date)))
  }

  // Data loading functions
  async subscribeMonth({ userId, isPNT = false }, month) {
    checkUserId(userId)
    month = toISOMonth(month)
    const key = await this.datasource.subscribeMonth({ userId, isPNT }, month)
    return {
      stop: async () => {
        return this.datasource.unsubscribeMonth(userId, key)
      }
    }
  }

  async refreshMonth({ userId, isPNT = false }, month) {
    checkUserId(userId)
    month = toISOMonth(month)
    return this.datasource.refreshMonth({ userId, isPNT }, month)
  }

  async unsubscribeMonth(userId, month) {
    checkUserId(userId)
    month = toISOMonth(month)
    return this.datasource.unsubscribeMonth(userId, month)
  }

  async subscribeInterval({ userId, isPNT = false }, start, end) {
    checkUserId(userId)
    if (DateTime.isDateTime(start)) {
      start = start.toMillis()
    }
    if (DateTime.isDateTime(end)) {
      end = end.toMillis()
    }

    const subKey = await this.datasource.subscribeInterval({ userId, isPNT }, start, end)
    return {
      stop: async () => {
        return this.datasource.unsubscribe(userId, subKey)
      }
    }
  }

  async refreshInterval({ userId, isPNT = false }, start, end) {
    checkUserId(userId)
    if (DateTime.isDateTime(start)) {
      start = start.toMillis()
    }
    if (DateTime.isDateTime(end)) {
      end = end.toMillis()
    }
    return this.datasource.refreshInterval({ userId, isPNT }, start, end)
  }

  async unsubscribe(userId, subKey) {
    checkUserId(userId)
    return this.datasource.unsubscribe(userId, subKey)
  }

  async bulkUpdate(updateLog) {
    if (updateLog.insert.length ||
      updateLog.update.length ||
      updateLog.remove.length) {
      return this.datasource.bulkUpdate(updateLog)
    }
  }

  // Reactive data functions
  getDay(userId, date) {
    return this.daysMap.get(this.constructor.getKey(userId, date))
  }

  getEvent(id) {
    return this.eventsIndex.get(id)
  }

  // Static functions
  static getKey(userId, date) {
    if (!userId) throw new Error('No userId passed !')
    return [userId, date].join('.')
  }
}
