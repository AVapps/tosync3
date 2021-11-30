import { Calendar } from '@ionic-native/calendar'

window.IOSCalendar = Calendar

export async function ensurePermission() {
  return Calendar.hasReadWritePermission()
}

export async function listCalendars() {
  const calendars = await Calendar.listCalendars()
  return calendars.filter(calendar => ['CalDAV', 'Local', 'Exchange'].includes(calendar.type))
}

// fetch events from date range
export async function fetchEvents(startDate, endDate) {
  const events = await Calendar.listEventsInRange(startDate, endDate)
  return events
}
