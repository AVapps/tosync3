import { PouchDBCollection } from './PouchDBCollection.js'
import { set, findLast, sortBy } from 'lodash'
import { DateTime } from 'luxon'

const JOUR = 24 * 60 * 60 * 1000
const MAX = '\ufff0'

function toBasicIsoZ(ts) {
  return DateTime.fromMillis(ts, { zone: 'utc' })
    .toISO({ format: 'basic' })
    .substring(0, 13)
}

export class EventsCollection extends PouchDBCollection {
  constructor() {
    super('events', {
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

  async getInterval(userId, start, end) {
    let events = await this.findUserEvents(userId, start - (7 * JOUR), end)

    if (!events.length) {
      return []
    }

    // possibilité d'optimiser en utilisant une boucle s'arrêtant dès que evt.start >= start
    let hasOverlap
    events = events.filter(evt => {
      if (evt.tag === 'rotation' && evt.start < start && evt.end >= start) {
        hasOverlap = evt
        // console.log('isRotation before')
        return true
      }
      if (evt.end >= start) {
        // console.log('end after start')
        return true
      }
      if (hasOverlap) {
        // console.log('is duty in before start')
        return evt?.rotationId === hasOverlap._id
      }
      return false
    })

    const hasOverlapEnd = findLast(events, evt => evt.tag === 'rotation' && evt.end > end)
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
    return result.rows.map(row => row.doc).sort(this.constructor.eventsComp)
  }

  async processBulkUpdate({ userId, remove, insert, update }) {
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
        evt.userId = userId
        evt.created = now
        if (!evt._id) {
          evt._id = this.getId(evt)
        }
      })
      docs.push(...insertSorted)
    }

    if (update && update.length) {
      const updateMap = update.map(upd => {
        const doc = { _id: upd._id, _rev: upd._rev }
        set(upd.modifier, '$set.updated', now)
        Object.assign(doc, upd.modifier.$set)
        return doc
      })
      docs.push(updateMap)
    }

    result.docs = docs
    result.result = await this.collection.bulkDocs(docs)
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
          console.error('Rotation introuvable', evt, events)
        }
        return
      }
      groupedEvents.push(evt)
    })
    return groupedEvents
  }
}

export const Events = new EventsCollection()
