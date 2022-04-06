import { DateTime } from 'luxon'

import { Calendar } from 'capacitor-calendar2'
import { getEventsToSync, filterEventsByTags, getUserWatermark } from '@/lib/Export'
import { isMatch, difference, pick } from 'lodash'

window.CapacitorCalendar = Calendar

const TIMEZONE = 'Europe/Paris'

export function maxSyncDate() {
  return DateTime.now().setZone(TIMEZONE).plus({ days: 40 }).endOf('day')
}

export function minSyncDate() {
  return DateTime.now().setZone(TIMEZONE).startOf('month')
}

export async function checkPermissions() {
  return Calendar.checkPermissions()
}

export async function listCalendars() {
  await Calendar.requestPermissions()
  const { availableCalendars } = await Calendar.getAvailableCalendars()
  return availableCalendars
}

// fetch events from date range and calendar Id
export async function fetchDeviceEvents(startDate, endDate, calendarId) {
  const { events } = await Calendar.findEvent({
    startDate,
    endDate,
    calendarId
  })
  return events
}

const watermarkRE = /(METEORCREW$)|(CHOPETO$)/

function filterDeviceEvents(events, userId) {
  return events.filter(evt => {
    return watermarkRE.test(evt.id) || (new RegExp(`${userId}\\d{8}`)).test(evt.id) || evt?.notes?.includes(getUserWatermark(userId))
  })
}

function simpleSlug(event, userId) {
  return `${userId}_${event.startDate}_${event.endDate}`
}

export async function syncEventsInRange(userId, startDateTime, endDateTime, calendars, options) {
  const unfilteredEventsToSync = await getEventsToSync(userId, startDateTime, endDateTime, options)
  for (const calendar of calendars) {
    await syncEventsCategoriesInRangeForCalendar(
      userId,
      startDateTime,
      endDateTime,
      { calendarId: calendar.id, tags: calendar.tags, ...options },
      unfilteredEventsToSync
    )
  }
}

export async function syncEventsCategoriesInRangeForCalendar(
  userId,
  startDateTime,
  endDateTime,
  { calendarId, tags, ...options },
  unfilteredEventsToSync
) {
  let filteredEventsToSync
  console.log('unfilteredEventsToSync', unfilteredEventsToSync, calendarId, tags)
  if (!unfilteredEventsToSync || !unfilteredEventsToSync.length) {
    filteredEventsToSync = await getEventsToSync(userId, startDateTime, endDateTime, { tags, ...options })
  } else {
    filteredEventsToSync = filterEventsByTags(unfilteredEventsToSync, tags)
  }

  const localEvents = await fetchDeviceEvents(startDateTime.toJSDate(), endDateTime.toJSDate(), calendarId)
  const filteredLocalEvents = filterDeviceEvents(localEvents, userId)
  console.log(filteredEventsToSync, filteredLocalEvents)

  const localEventsMap = new Map()
  filteredLocalEvents.forEach(evt => {
    localEventsMap.set(simpleSlug(evt, userId), evt)
  })

  const updateRegistry = {
    insert: [],
    update: [],
    remove: []
  }
  const keep = []

  filteredEventsToSync.forEach(evt => {
    const slug = simpleSlug(evt, userId)
    if (localEventsMap.has(slug)) {
      const localEvt = localEventsMap.get(slug)
      keep.push(localEvt.id)
      const evtPartial = pick(evt, 'title', 'startDate', 'endDate', 'notes', 'isAllDay')
      if (!isMatch(localEvt, evtPartial)) {
        updateRegistry.update.push({ id: localEvt.id, ...evtPartial })
      }
    } else {
      updateRegistry.insert.push({ ...evt, calendarId })
    }
  })

  updateRegistry.remove = difference(filteredLocalEvents.map(e => e.id), keep)
  console.log(updateRegistry)

  const result = await Calendar.batchUpdate(updateRegistry)
  console.log(result)
}
