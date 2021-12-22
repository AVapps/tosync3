import { Events } from '@/model/Events'
import { DateTime } from 'luxon'

import { Calendar } from 'capacitor-calendar2'
import { getEventsToSync } from '@/lib/Export'

window.CapacitorCalendar = Calendar

const TIMEZONE = 'Europe/Paris'

export function maxSyncDate() {
  return DateTime.now().setZone(TIMEZONE).plus({ days: 31 }).endOf('day')
}

export function minSyncDate() {
  return DateTime.now().setZone(TIMEZONE).startOf('month').minus({ months: 2 })
}

export async function listCalendars() {
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

export async function syncEventsInRange(userId, startDateTime, endDateTime, options) {
  const eventsToSync = await getEventsToSync(userId, startDateTime, endDateTime, options.tags)
  console.log(eventsToSync)

  const localEvents = await fetchDeviceEvents(startDateTime.toJSDate(), endDateTime.toJSDate())

  console.log(localEvents)
}
