import { DateTime } from 'luxon'
import { isEmpty, filter, get, keys, has, first, last } from 'lodash'
import { renderEventDescription, renderEventTitle } from './Exporter'
import { ALLDAY_TAGS, slug } from './Utils'

import { Events } from '@/model/Events'

export const SYNC_CATEGORIES = {
  vol: ['vol', 'mep'],
  rotation: ['rotation'],
  repos: ['repos'],
  conges: ['conges'],
  sol: ['sol', 'stage', 'simu', 'reserve', 'delegation', 'autre'],
  instruction: ['instructionSol', 'instructionSimu'],
  sanssolde: ['absence', 'sanssolde', 'greve'],
  maladie: ['maladie'],
  blanc: ['blanc', 'jisap', 'npl']
}

const SYNC_CATEGORIES_LABEL = {
  vol: 'Vols',
  rotation: 'Rotations',
  repos: 'Repos',
  conges: 'Congés',
  sol: 'Activités sol',
  instruction: 'Instruction',
  sanssolde: 'Sans solde',
  maladie: 'Maladie',
  blanc: 'Blancs'
}

const SYNC_TAG_CATEGORIES = {
  rotation: 'rotation',
  vol: 'vol',
  mep: 'vol',
  absence: 'sanssolde',
  conges: 'conges',
  sanssolde: 'sanssolde',
  blanc: 'blanc',
  jisap: 'blanc',
  npl: 'blanc',
  repos: 'repos',
  maladie: 'maladie',
  greve: 'sanssolde',
  stage: 'sol',
  sol: 'sol',
  instructionSol: 'instruction',
  simu: 'sol',
  instructionSimu: 'instruction',
  reserve: 'sol',
  delegation: 'sol',
  autre: 'sol'
}

function toUTCISOString(ts) {
  return DateTime.fromMillis(ts, { zone: 'utc' })
    .set({ milliseconds: 0 })
    .toISO({ suppressMilliseconds: true })
}

export function getUserWatermark(userId) {
  return `<TOSYNC:${userId}>`
}

export function getUserIdFromWatermark(watermark) {
  const match = watermark.match(/<TOSYNC:([A-Z]{3})>/)
  return match ? match[1] : null
}

export function getSyncCategorie(tag) {
  return get(SYNC_TAG_CATEGORIES, tag)
}

export function getSyncCategories() {
  return keys(SYNC_CATEGORIES)
}

export function getSyncCategoryLabel(tag) {
  return get(SYNC_CATEGORIES_LABEL, tag)
}

export function filterEventsByTags(events, tags) {
  return isEmpty(tags)
    ? []
    : filter(events, (evt) => {
      const syncCategorie = get(SYNC_TAG_CATEGORIES, evt.tag)
      return tags.includes(syncCategorie)
    })
}

function flattenEvents(events) {
  return events.reduce((acc, evt) => {
    if (evt.events && events.length) {
      if (has(evt, 'peq')) {
        first(evt.events).peq = evt.peq
      }
      if (has(evt, 'instruction')) {
        first(evt.events).instruction = evt.instruction
      }
      acc.push(...evt.events.map(sol => ({ ...sol, slug: slug(sol, evt.userId) })))
    } else if (evt.tag === 'rotation' && evt.sv && evt.sv.length) {
      evt.sv.forEach(sv => {
        if (sv.events && sv.events.length) {
          if (has(sv, 'peq')) {
            first(sv.events).peq = sv.peq
          }
          if (has(sv, 'instruction')) {
            first(sv.events).instruction = sv.instruction
          }
          if (has(sv, 'hotel')) {
            last(sv.events).hotel = sv.hotel
          }
          acc.push(...sv.events.map(vol => ({ ...vol, slug: slug(vol, evt.userId) })))
        }
      })
      acc.push(evt)
    } else {
      acc.push(evt)
    }
    return acc
  }, [])
}

export function transformEventsToSync(userId, events, options = {}) {
  return events.map((evt) => {
    return {
      tag: evt.tag,
      title: renderEventTitle(evt, options),
      startDate: toUTCISOString(evt.start),
      endDate: toUTCISOString(evt.end),
      notes: renderEventDescription(evt, options) + '\n\n' + getUserWatermark(userId),
      isAllDay: ALLDAY_TAGS.includes(evt.tag)
    }
  })
}

export function transformEventsToICalendarFormat(userId, events, options = {}) {
  return events.map((evt) => {
    return {
      uid: evt.slug,
      tag: evt.tag,
      summary: renderEventTitle(evt, options),
      start: evt.start,
      end: evt.end,
      description: renderEventDescription(evt, options) + '\n\n' + getUserWatermark(userId),
      isAllDay: ALLDAY_TAGS.includes(evt.tag)
    }
  })
}

/**
 * Get events between two dates for given userId and transform them to export format
 * @param {string} userId
 * @param {any} startDate
 * @param {any} endDate
 */
export async function getEventsToSync(userId, startDate, endDate, options = {}) {
  let eventsToSync = await Events.getInterval(userId, startDate, endDate)
  eventsToSync = flattenEvents(eventsToSync)
  console.log('eventsToSync unfiltered', eventsToSync.length)
  if (options?.tags && options.tags.length) {
    eventsToSync = filterEventsByTags(eventsToSync, options.tags)
    console.log('eventsToSync filtered', eventsToSync.length)
  }
  return transformEventsToSync(userId, eventsToSync, options)
}

/**
 * Export events to iCal format for given userId and between two dates
 * @param {string} userId
 * @param {DateTime} startDate
 * @param {DateTime} endDate
 * @param {object} options
 * @param {string[]} options.categories
 *
 */
export async function exportIcs(userId, startDateTime, endDateTime, options) {
  const { IcsFile } = await import('./IcsFile.js')
  const filename = ['TO.sync', 'planning', startDateTime.toISODate(), endDateTime.toISODate()].join('_') + '.ics'
  let eventsToSync = await Events.getInterval(userId, startDateTime, endDateTime)
  eventsToSync = flattenEvents(eventsToSync)
  console.log('eventsToSync unfiltered', eventsToSync.length)
  if (options?.tags && options.tags.length) {
    eventsToSync = filterEventsByTags(eventsToSync, options.tags)
    console.log('eventsToSync filtered', eventsToSync.length)
  }
  const events = transformEventsToICalendarFormat(userId, eventsToSync, options)
  console.log(events)
  const icsFile = new IcsFile(events)
  icsFile.generate(options)
  icsFile.save(filename)
}
