import { DexieCollection } from './DexieCollection.js'
import { set, findLast } from 'lodash'
import Dexie from 'dexie'

const JOUR = 24 * 60 * 60 * 1000

export class EventsCollection extends DexieCollection {
  constructor() {
    super('events')
  }

  async getInterval(userId, start, end) {
    let events = await this.find('[userId+start+end]')
      .between(
        [userId, start - (7 * JOUR), Dexie.minKey], // lowerBound
        [userId, end, Dexie.maxKey], // upperBound
        true, // includeLower
        true  // includeUpper
      )
      .toArray()

    if (!events.length) {
      return []
    }

    let hasOverlap
    events = events.sort(eventsComp)
      .filter(evt => {
        if (evt.start >= start) {
          return true
        } else if (hasOverlap) {
          return evt.rotationId === hasOverlap._id
        } else if (evt.tag === 'rotation' && evt.end >= start) {
          hasOverlap = evt
          return true
        }
      })

    const hasOverlapEnd = findLast(events, evt => evt.tag === 'rotation' && evt.end > end)
    if (hasOverlapEnd) { // Ajouter les SV manquants
      const lastSvs = await this.find('[userId+start+end]')
        .between(
          [userId, end, end], // lowerBound
          [userId, hasOverlapEnd.end, hasOverlapEnd.end], // upperBound
          false, // includeLower
          true // includeUpper
        )
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

  async processBulkUpdate(updateLog) {
    const now = Date.now()
    const userId = updateLog.userId
    const result = { startedAt: now }

    result.tx = await this.db.transaction('rw', this.collection, async () => {
      if (updateLog.remove && updateLog.remove.length) {
        result.removed = await Events.bulkRemove(updateLog.remove)
      }

      if (updateLog.rotationInsert && updateLog.rotationInsert.length) {
        result.insertedRotations = await Promise.all(updateLog.rotationInsert.map(async ({ rotation, sv }) => {
          rotation.userId = userId
          rotation.created = now
          const rotationId = await Events.insert(rotation)
          sv.forEach(({ ref, _id }) => {
            if (_id) {
              set(updateLog.update, [_id, '$set', 'rotationId'], rotationId)
            } else {
              ref.rotationId = rotationId
            }
          })
          return rotationId
        }))
      }

      if (updateLog.insert && updateLog.insert.length) {
        updateLog.insert.forEach(evt => {
          evt.userId = userId
          evt.created = now
        })
        result.inserted = await Events.bulkInsert(updateLog.insert)
      }

      if (updateLog.update && updateLog.update.length) {
        result.updated = await Promise.all(updateLog.update.map(upd => {
          set(upd.modifier, '$set.updated', now)
          return Events.update(upd._id, upd.modifier.$set)
        }))
      }
    })

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