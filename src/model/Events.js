import { PouchDBCollection } from './PouchDBCollection.js'
import { findLast, sortBy } from 'lodash'
import { DateTime } from 'luxon'
import { toDateTime } from '@/helpers/dates.js'

const JOUR = 24 * 60 * 60 * 1000
const MAX = '\ufff0'

function toBasicIsoZ(date) {
  return toDateTime(date)
    .toUTC()
    .toISO({ format: 'basic' })
    .substring(0, 13)
}

export class EventsCollection extends PouchDBCollection {
  constructor() {
    super('Events', {
      idFunction: ({ userId, tag, start, end, events }) => {
        const params = [userId, toBasicIsoZ(start), toBasicIsoZ(end)]
        if (tag === 'rotation') {
          params.push(tag)
        } else if (events) {
          params.push('sv')
        }
        return params.join('-')
      }
    })
  }

  /**
   * Retourne les évènements entre 'start' et 'end'
   * @param {string} userId
   * @param {any} start
   * @param {any} end
   */
  async getInterval(userId, start, end) {
    start = toDateTime(start)
    end = toDateTime(end)
    let events = await this.findUserEvents(userId, start.minus({ days: 7 }), end)

    if (!events.length) {
      return []
    }

    const startISO = start.toISO()
    const endISO = end.toISO()

    // possibilité d'optimiser en utilisant une boucle s'arrêtant dès que evt.start >= start
    let hasOverlap
    events = events.filter(evt => {
      if (evt.tag === 'rotation' && evt.start < startISO && evt.end >= startISO) {
        hasOverlap = evt
        // console.log('isRotation before')
        return true
      }
      if (evt.end >= startISO) {
        // console.log('end after start')
        return true
      }
      if (hasOverlap) {
        // console.log('is duty in before start')
        return evt?.rotationId === hasOverlap._id
      }
      return false
    })

    const hasOverlapEnd = findLast(events, evt => evt.tag === 'rotation' && evt.end > endISO)
    if (hasOverlapEnd) { // Ajouter les SV manquants
      const lastSvs = await this.findUserEvents(userId, end, hasOverlapEnd.end, { inclusive_start: false })
        .filter(evt => {
          return evt.rotationId === hasOverlapEnd._id
        })
        .toArray()
      if (lastSvs && lastSvs.length) {
        events.push(...lastSvs)
      }
    }

    const groupedEvents = this.constructor.groupEvents(events)
    console.log(`%cEvents.getInterval%c : ${userId}`, 'color:teal', 'color:inherit', groupedEvents, hasOverlap, hasOverlapEnd)

    return groupedEvents
  }

  // Liste les évènements dont le début est compris entre 'start' et 'end'
  async findUserEvents(userId, start, end, options = {}) {
    const { inclusiveStart = true, inclusiveEnd = true } = options
    const result = await this.collection.allDocs({
      startkey: [userId, toBasicIsoZ(start), inclusiveStart ? 0 : MAX].join('-'),
      endkey: [userId, toBasicIsoZ(end), inclusiveEnd ? MAX : 0].join('-'),
      inclusive_end: inclusiveEnd,
      include_docs: true
    })
    console.log('[Events.findUserEvents]', userId, start, end, options, result)
    return result.rows.map(row => row.doc).sort(this.constructor.eventsComp)
  }

  async processBulkUpdate({ remove, insert, update }) {
    const now = Date.now()
    const result = { startedAt: now }

    const docs = []

    if (remove && remove.length) {
      // Supprimer les rotations avant les SV
      const removeSorted = sortBy(remove, [doc => doc.rotationId ? 'sv' : doc.tag, 'start'])
      removeSorted.forEach(doc => {
        doc._deleted = true
      })
      docs.push(...removeSorted)
    }

    if (insert && insert.length) {
      // Insérer les rotations avant les SV
      const insertSorted = sortBy(insert, [doc => doc.rotationId ? 'sv' : doc.tag, 'start'])
      insertSorted.forEach(evt => {
        evt.created = now
        if (!evt._id) {
          evt._id = this.getId(evt)
        }
      })
      docs.push(...insertSorted)
    }

    if (update && update.length) {
      const updates = update.map(evt => {
        evt.updated = now
        return evt
      })
      docs.push(...updates)
    }

    result.docs = docs
    result.result = docs.length ? await this.collection.bulkDocs(docs) : []
    result.completedAt = Date.now()
    return result
  }

  // Static methods
  static eventsComp(evtA, evtB) {
    if (evtA.start < evtB.start) {
      return -1
    } else if (evtA.start > evtB.start) {
      return 1
    } else {
      if (evtA.end > evtB.end) {
        return -1
      } else if (evtA.end < evtB.end) {
        return 1
      }
    }
    return 0
  }

  static groupEvents(events) {
    const groupedEvents = []
    const rotationMap = new Map()
    events.forEach(evt => {
      if (evt.tag === 'rotation') {
        evt.sv = []
        rotationMap.set(evt._id, evt)
      }
    })
    events.forEach(evt => {
      if (evt.rotationId) {
        if (rotationMap.has(evt.rotationId)) {
          const rotation = rotationMap.get(evt.rotationId)
          rotation.sv.push(evt)
        } else {
          console.log('Rotation introuvable', evt, events)
        }
        return
      }
      groupedEvents.push(evt)
    })
    return groupedEvents
  }
}

export const Events = new EventsCollection()
