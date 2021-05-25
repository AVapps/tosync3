import { PouchDBCollection } from './PouchDBCollection.js'
import { set, findLast } from 'lodash'
import { DateTime } from 'luxon'

const JOUR = 24 * 60 * 60 * 1000
const MAX = '\ufff0'

function toBasicIsoZ(ts) {
  return DateTime.fromMillis(ts, { zone: 'utc' })
    .toISO({ format: 'basic'})
    .substring(0,13)
}

export class EventsCollection extends PouchDBCollection {
  constructor() {
    super('events', {
      idFunction: ({ userId, tag, start, end }) => {
        return [userId, toBasicIsoZ(start), toBasicIsoZ(end), tag === 'rotation' ? '' : tag ].join('-')
      }
    })
  }

  async getInterval(userId, start, end) {
    let events = await this.findUserEvents(userId, start - (7 * JOUR), end)
    console.log(userId, start, end, events)

    if (!events.length) {
      return []
    }

    // possibilité d'optimiser en utilisant une boucle s'arrêtant dès que evt.start >= start
    let hasOverlap
    events = events.sort(eventsComp)
      .filter(evt => {
        if (evt.tag === 'rotation' && evt.start < start && evt.end >= start) {
          hasOverlap = evt
          console.log('isRotation before')
          return true
        }
        if (evt.end >= start) {
          console.log('end after start')
          return true
        }
        if (hasOverlap) {
          console.log('is duty in before start')
          return evt?.rotationId === hasOverlap._id
        }
        console.log('false')
      })
    
    console.log(events, hasOverlap)

    const hasOverlapEnd = findLast(events, evt => evt.tag === 'rotation' && evt.end > end)
    console.log(hasOverlapEnd)
    if (hasOverlapEnd) { // Ajouter les SV manquants
      const lastSvs = await this.findUserEvents(userId, end, hasOverlapEnd.end, { inclusive_start: false })
        .filter(evt => {
          return evt.rotationId === hasOverlapEnd._id
        })
        .toArray()
      if (lastSvs && lastSvs.length) {
        lastSvs.sort(eventsComp)
        events.push(...lastSvs)
      }
    }

    return events
  }

  // Liste les évènements dont le début est compris entre 'start' et 'end'
  async findUserEvents(userId, start, end, options = {}) {
    const { inclusive_start = true, inclusive_end = true } = options
    const result = await this.collection.allDocs({
      startkey: [userId, toBasicIsoZ(start), inclusive_start ? 0 : MAX].join('-'),
      endkey: [userId, toBasicIsoZ(end), inclusive_end ? MAX : 0].join('-'),
      inclusive_end,
      include_docs: true
    })
    return result.rows.map(row => row.doc)
  }

  async processBulkUpdate(updateLog) {
    const now = Date.now()
    const userId = updateLog.userId
    const result = { startedAt: now }

    const docs = []

    if (updateLog.remove && updateLog.remove.length) {
      updateLog.remove.forEach(doc => {
        doc._deleted = true
      })
      docs.push(...updateLog.remove)
    }

    if (updateLog.rotationInsert && updateLog.rotationInsert.length) {
      updateLog.rotationInsert.forEach(({ rotation, sv }) => {
        rotation.userId = userId
        rotation.created = now
        rotation._id = this.getId(rotation)
        sv.forEach(({ ref, _id }) => {
          if (_id) {
            set(updateLog.update, [_id, '$set', 'rotationId'], rotation._id)
          } else {
            ref.rotationId = rotation._id
          }
        })
        docs.push(rotation)
      })
    }

    if (updateLog.insert && updateLog.insert.length) {
      updateLog.insert.forEach(evt => {
        evt.userId = userId
        evt.created = now
        evt._id = this.getId(evt)
      })
      docs.push(...updateLog.insert)
    }

    if (updateLog.update && updateLog.update.length) {
      const updateMap = updateLog.update.map(upd => {
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
}

export const Events = new EventsCollection()

function eventsComp(evtA, evtB) {
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