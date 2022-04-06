import { SimpleEventEmitter } from '@/lib/EventEmitter'
import { AsyncTasksQueue } from './TasksQueue'
import { Events } from './Events'
import { DateTime, Interval, Settings } from 'luxon'
import { getIntervalDates, toDateTime } from '@/helpers/dates'
import { checkUserId, checkISODate} from '@/helpers/check'
import { getDayParams } from '@/helpers/calendar'
import { compact, difference, has, remove, some } from 'lodash'
import { remuForEvent, remuForDay, remuForMonth } from '@/lib/Remu/Remu'

const TIMEZONE = 'Europe/Paris'

Settings.defaultLocale = 'fr'
Settings.defaultZoneName = TIMEZONE

export class EventsDatasource extends SimpleEventEmitter {
  constructor() {
    super()
    this._events = new Map()
    this._days = new Map()
    this._subs = new Map()
    this._userIsPNT = new Map()
    this._tasksQueue = new AsyncTasksQueue()
    this.db = Events
    this.watchHandle = null
  }

  /**
   * start: millis or isoString or DateTime
   * end: millis or isoString or DateTime
   */
  async subscribeInterval({ userId, isPNT = false }, start, end) {
    checkUserId(userId)
    start = toDateTime(start).startOf('day')
    end = toDateTime(end).endOf('day')
    const interval = Interval.fromDateTimes(start, end)

    return this._tasksQueue.enqueue(
      async () => {
        const { sub } = await this._subscribeInterval({ userId, isPNT }, interval)
        return sub.iso
      }
    )
  }

  async unsubscribe(userId, subKey) {
    checkUserId(userId)

    return this._tasksQueue.enqueue(
      async () => {
        if (!this._subs.has(userId)) {
          throw new Error('User has no active subscriptions !')
        }

        const userSubs = this._subs.get(userId)
        if (!userSubs.has(subKey)) {
          throw new Error('Invalid subscription key supplied for user !')
        }

        const sub = userSubs.get(subKey)
        return this._unsubscribe(sub.userId, sub.iso)
      }
    )
  }

  /**
   * Subscribe to events for a given interval and user
   * @param {Object} user
   * @param {String} user.userId 
   * @param {Bool} user.isPNT 
   * @param {Interval} interval
   * @returns Object
   */
  async _subscribeInterval({ userId, isPNT = false }, interval) {
    const iso = interval.toISODate()
    console.log(`%cEventsDatasource._subscribeInterval%c : ${userId}-${iso}`, 'color:green', 'color:inherit')

    if (!this._subs.has(userId)) {
      this._subs.set(userId, new Map())
    }

    this._userIsPNT.set(userId, isPNT)

    const userSubs = this._subs.get(userId)
    if (!userSubs.has(iso)) {
      const subscription = {
        userId,
        isPNT,
        iso,
        interval,
        dates: getIntervalDates(interval.start, interval.end),
        count: 1
      }
      const events = await this._fetchEvents(subscription)
      const result = this._loadEvents({ events, ...subscription}) // { events, days }
      userSubs.set(iso, subscription)
      return { ...result, sub: subscription }
    } else {
      const sub = userSubs.get(iso)
      sub.count++
      return { sub }
    }
  }

  _unsubscribe(userId, key) {
    checkUserId(userId)
    console.log(`%cEventsDatasource._unsubscribe%c : ${userId}-${key}`, 'color:orange', 'color:inherit')

    if (!this._subs.has(userId)) {
      return
    }

    if (!this._days.has(userId)) { // Has subs but no days => error
      throw new Error('No user days data found!')
    }

    const userSubs = this._subs.get(userId)
    if (!userSubs.has(key)) {
      return
    }

    const sub = userSubs.get(key)
    if (sub.count > 1) {
      sub.count--
    } else {
      // Delete subscription
      userSubs.delete(key)

      // Clean user's days Map
      this._cleanDays(userId)

      // Clean user's unsubscribed events
      this._cleanEvents(userId)
    }
  }

  _cleanDays(userId) {
    console.time('EventsDatasource._cleanDays')
    const userSubs = this._subs.get(userId)
    const userDays = this._days.get(userId)
    const datesSet = new Set()
    userSubs.forEach(({ dates }) => {
      dates.forEach(date => datesSet.add(date))
    })
    // console.log('userDays', [...userDays.keys()], 'datesSet', [...datesSet])
    const diff = difference([...userDays.keys()], [...datesSet])
    // console.log('%cEventsDatasource._cleanDays diff', 'color:orange', diff)
    this.removeDays(userId, diff)
    console.timeEnd('EventsDatasource._cleanDays')
  }

  _cleanEvents(userId) {
    console.time('EventsDatasource._cleanEvents')
    const userDays = this._days.get(userId)
    const activeUserEvents = new Set()
    userDays.forEach(({ events }) => {
      events.forEach(evt => {
        activeUserEvents.add(evt._id)
        if (evt.sv) {
          evt.sv.forEach(sv => activeUserEvents.add(sv._id))
        }
      })
    })
    const userEvents = [...this._events.keys()].filter(_id => _id.substring(0, 3) === userId)
    // console.log('userDays', [...userDays.keys()], 'datesSet', [...datesSet])
    const toRemove = difference(userEvents, [...activeUserEvents])
    if (toRemove.length) {
      // console.log('%cEventsDatasource._cleanEvents: toRemove', 'color:orange', toRemove)
      toRemove.forEach(_id => this._events.delete(_id))
      this.emit('events.remove', { ids: toRemove })
    }
    console.timeEnd('EventsDatasource._cleanEvents')
  }

  async refreshInterval({userId, isPNT = false }, start, end) {
    checkUserId(userId)

    start = toDateTime(start).startOf('day')
    end = toDateTime(end).endOf('day')

    const interval = Interval.fromDateTimes(start, end)

    return this._tasksQueue.enqueue(
      async () => {
        if (!this._subs.has(userId)) {
          return
        }

        const userSubs = this._subs.get(userId)
        const subsIntervals = Interval.merge([...userSubs.values()].map(sub => sub.interval))
        const intersections = compact(subsIntervals.map(subInterval => subInterval.intersection(interval)))
        for (const updateInterval of intersections) {
          const events = await this._fetchEvents({
            userId,
            interval: updateInterval
          })
          this._loadEvents({
            userId,
            isPNT,
            dates: getIntervalDates(updateInterval.start, updateInterval.end),
            events
          })
        }
        this._cleanEvents(userId)
      }
    )
  }

  /**
   * @param {String} userId
   * @param {Interval} interval
   * @param {[isoDate, ...]} dates
   * @returns [Event]
   */
  async _fetchEvents({ userId, interval }) {
    checkUserId(userId)
    console.time('EventsDatasource._fetchEvents')

    const events = await this.db.getInterval(userId, interval.start.valueOf(), interval.end.valueOf()) // SVs are grouped in rotations
    console.log('%cEventsDatasource._fetchEvents', 'color:green', userId, interval.start.toISODate(), interval.end.toISODate(), events)
    console.timeEnd('EventsDatasource._fetchEvents')
    return events
  }

  /**
   * Load events into the events Map and days Map
   * @param {String} userId
   * @param {[Event, ...]} Events
   * @param {[isoDate, ...]} dates
   * @returns
   */
  _loadEvents({ userId, events, dates, isPNT }) {
    checkUserId(userId)
    console.time('EventsDatasource._loadEvents')

    const eventsByDate = new Map()

    events.forEach(evt => {
      let cursor = DateTime.fromMillis(evt.start).startOf('day')
      const _dates = []
      while (cursor <= evt.end) {
        const iso = cursor.toISODate()
        _dates.push(iso)
        if (eventsByDate.has(iso)) {
          eventsByDate.get(iso).push(evt)
        } else {
          eventsByDate.set(iso, [evt])
        }
        cursor = cursor.plus({ day: 1 })
      }
      evt._dates = _dates

      // this.setRemuOfEvent(evt, isPNT)

      if (evt.tag === 'rotation') {
        evt.sv.forEach(sv => {
          // register sv in index
          this._events.set(sv._id, sv)
        })
        this.emit('events.set', { events: evt.sv })
      }

      // register event in index
      this._events.set(evt._id, evt)
    })
    this.emit('events.set', { events })

    const days = dates.map((date) => {
      const day = {
        date,
        events: []
      }
      if (eventsByDate.has(date)) {
        day.events = eventsByDate.get(date)
      }
      Object.assign(day, getDayParams(day))

      const remu = remuForDay(day, isPNT)
      if (remu) {
        day.remu = remu
        console.log('remuForDay', day, remu)
      }

      return day
    })

    this.setDays(userId, days)

    console.timeEnd('EventsDatasource._loadEvents')
    return { events, days }
  }

  setDay(userId, date, day) {
    checkUserId(userId)
    checkISODate(date)
    if (!this._days.has(userId)) {
      this._days.set(userId, new Map())
    }
    this._days.get(userId).set(date, day)
    this.emit('days.set', { userId, days: [day] })
  }

  setDays(userId, days) {
    checkUserId(userId)
    if (!this._days.has(userId)) {
      this._days.set(userId, new Map())
    }
    const userDays = this._days.get(userId)
    days.forEach(day => {
      userDays.set(day.date, day)
    })
    this.emit('days.set', { userId, days })
  }

  removeDay(userId, date) {
    checkUserId(userId)
    checkISODate(date)
    if (this._days.has(userId)) {
      this._days.get(userId).delete(date)
    }
    this.emit('days.remove', { userId, dates: [date] })
  }

  removeDays(userId, dates) {
    checkUserId(userId)
    if (this._days.has(userId)) {
      const userDays = this._days.get(userId)
      dates.forEach(date => {
        userDays.delete(date)
      })
    }
    this.emit('days.remove', { userId, dates })
  }

  watchDb() {
    this.watchHandle = this.db.collection
      .changes({
        since: 'now',
        live: true,
        include_docs: true
      })
      .on('change', ({ id, doc, deleted }) => {
        console.log('pouchdb CHANGE event', id, doc, deleted)

        if (deleted) {
          if (this._events.has(id)) {
            doc = this._events.get(id)
            console.log('deleted doc', doc)
            if (has(doc, 'rotationId')) {
              this.removeSV(doc)
            } else {
              this.removeEvent(doc)
            }
          }
          return
        }

        if (!doc.userId) return
        if (!this._subs.has(doc.userId) || !this._days.has(doc.userId)) return // User has no subscriptions yet : skip

        const userSubs = this._subs.get(doc.userId)
        const start = DateTime.fromMillis(doc.start)
        const end = DateTime.fromMillis(doc.end)
        const shouldUpdateDoc = some([...userSubs.values()], sub => {
          return sub.interval.contains(start) || sub.interval.contains(end)
        })
        console.log('shouldUpdateDoc', shouldUpdateDoc)
        if (!shouldUpdateDoc) return

        // change.id contains the doc id, change.doc contains the doc
        if (has(doc, 'rotationId')) {
          if (this._events.has(id)) {
            this.updateSV(doc)
          } else {
            this.addSV(doc)
          }
        } else {
          doc._dates = getIntervalDates(start, end)
          if (this._events.has(id)) {
            this.updateEvent(doc)
          } else {
            this.addEvent(doc)
          }
        }
      })
      .on('error', (err) => {
        console.log('PouchDB live changes error !', err)
      })
  }

  addEvent(doc) {
    // save event in index
    if (doc.tag === 'rotation' && !has(doc, 'sv')) {
      doc.sv = []
    }
    // this.setRemuOfEvent(doc)
    this._events.set(doc._id, doc)
    this.emit('events.set', { events: [doc] })

    if (!this._days.has(doc.userId)) return // User has no subscriptions yet : skip
    const userDays = this._days.get(doc.userId)

    // save event in days
    doc._dates.forEach(date => {
      if (!userDays.has(date)) return // Date has not been subcribed by user : skip

      const day = userDays.get(date)
      const position = day.events.findIndex(evt => evt.start > doc.start)
      if (position === -1) {
        day.events.push(doc)
      } else {
        day.events.splice(position, 0, doc)
      }
      this.updateDay(doc.userId, day)
    })
  }

  updateEvent(doc) {
    // this.setRemuOfEvent(doc)
    // save event in index
    this._events.set(doc._id, doc)
    this.emit('events.set', { events: [doc] })

    if (!this._days.has(doc.userId)) return // User has no subscriptions yet : skip
    const userDays = this._days.get(doc.userId)

    // update days
    const oldDoc = this._events.get(doc._id)
    difference(oldDoc._dates, doc._dates).forEach(date => {
      const day = userDays.get(date)
      if (day) {
        remove(day.events, { _id: doc._id })
        this.updateDay(doc.userId, day)
      }
    })

    doc._dates.forEach(date => {
      if (!userDays.has(date)) return // Date has not been subcribed : skip

      const day = userDays.get(date)
      const index = day.events.findIndex(evt => evt._id === doc._id)
      if (index !== -1) { // event found => replace event
        day.events.splice(index, 1, doc)
      } else { // event not found => insert event
        const position = day.events.findIndex(evt => evt.start > doc.start)
        if (position === -1) {
          day.events.push(doc)
        } else {
          day.events.splice(position, 0, doc)
        }
      }
      this.updateDay(doc.userId, day)
    })
  }

  removeEvent(doc) {
    const oldDoc = this._events.get(doc._id)
    this._events.delete(doc._id)
    this.emit('events.remove', { ids: [doc._id] })

    if (!this._days.has(doc.userId)) return // User has no subscriptions yet : skip
    const userDays = this._days.get(doc.userId)

    oldDoc._dates.forEach(date => {
      if (!userDays.has(date)) return // Date has not been subcribed : skip
      const day = userDays.get(date)
      remove(day.events, { _id: doc._id })
      this.updateDay(doc.userId, day)
    })
  }

  addSV(doc) {
    // save sv in index
    this._events.set(doc._id, doc)
    this.emit('events.set', { events: [doc] })

    const rotation = this._events.get(doc.rotationId)
    // update rotation if it exists
    if (rotation) {
      const position = rotation.sv.findIndex(sv => sv.start > doc.start)
      if (position === -1) {
        rotation.sv.push(doc)
      } else {
        rotation.sv.splice(position, 0, doc)
      }
      // this.setRemuOfEvent(rotation)
      this.emit('events.set', { events: [rotation] })
      // update days
      if (!this._days.has(doc.userId)) return // User has no subscriptions yet : skip
      const userDays = this._days.get(doc.userId)
      rotation._dates.forEach(date => {
        if (!userDays.has(date)) return // Date has not been subcribed : skip
        const day = userDays.get(date)
        this.updateDay(rotation.userId, day)
      })
    }
  }

  updateSV(doc) {
    // save sv in index
    this._events.set(doc._id, doc)
    this.emit('events.set', { events: [doc] })

    const rotation = this._events.get(doc.rotationId)
    // update rotation if it exists
    if (rotation) {
      const index = rotation.sv.findIndex(sv => sv._id === doc._id)
      if (index !== -1) { // sv found => replace sv
        rotation.sv.splice(index, 1, doc)
      } else { // sv not found => insert sv
        const position = rotation.sv.findIndex(sv => sv.start > doc.start)
        if (position === -1) {
          rotation.sv.push(doc)
        } else {
          rotation.sv.splice(position, 0, doc)
        }
      }
      // this.setRemuOfEvent(rotation)
      this.emit('events.set', { events: [rotation] })
      // update days
      if (!this._days.has(doc.userId)) return // User has no subscriptions yet : skip
      const userDays = this._days.get(doc.userId)
      rotation._dates.forEach(date => {
        if (!userDays.has(date)) return // Date has not been subcribed : skip
        const day = userDays.get(date)
        this.updateDay(rotation.userId, day)
      })
    }
  }

  removeSV(doc) {
    this._events.delete(doc._id)
    this.emit('events.remove', { ids: [doc._id] })

    const rotation = this._events.get(doc.rotationId)
    // update rotation if it exists
    if (rotation) {
      remove(rotation.sv, { _id: doc._id })
      // this.setRemuOfEvent(rotation)
      this.emit('events.set', { events: [rotation] })
      // update days
      if (!this._days.has(doc.userId)) return // User has no subscriptions yet : skip
      const userDays = this._days.get(doc.userId)
      rotation._dates.forEach(date => {
        if (!userDays.has(date)) return // Date has not been subcribed : skip
        const day = userDays.get(date)
        this.updateDay(rotation.userId, day)
      })
    }
  }

  updateDay(userId, day) {
    Object.assign(day, getDayParams(day))
    const remu = remuForDay(day, this._userIsPNT(userId))
    if (remu) {
      day.remu = remu
      console.log('remuForDay', day, remu)
    }
    this.emit('days.set', { userId, days: [day] })
  }

  setRemuOfEvent(evt, isPNT) {
    const remu = remuForEvent(evt, isPNT ?? this._userIsPNT.get(evt.userId))
    if (remu) {
      evt.remu = remu
      console.log('remuForEvent', evt, remu)
    }
    return remu
  }

  async bulkUpdate(updateLog) {
    if (updateLog.insert.length ||
      updateLog.update.length ||
      updateLog.remove.length) {
      return this.db.processBulkUpdate(updateLog)
    }
  }

  /**
   *
   * @param {isoDate String} date
   * @returns
   */
  getDay(userId, date) {
    checkUserId(userId)
    return this._days.has(userId) ? this._days.get(userId).get(date) : undefined
  }
}
