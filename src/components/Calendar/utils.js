import { DateTime, Settings } from 'luxon'
import { includes, filter } from 'lodash'
import { Events } from '@/model/Events'
import { ALLDAY_TAGS } from '@/lib/Utils'

const TIMEZONE = 'Europe/Paris'
Settings.defaultLocale = 'fr'
Settings.defaultZoneName = TIMEZONE

export const WEEKDAYS = {
  1: { short: 'Lu', long: 'Lundi' },
  2: { short: 'Ma', long: 'Mardi' },
  3: { short: 'Me', long: 'Mercredi' },
  4: { short: 'Je', long: 'Jeudi' },
  5: { short: 'Ve', long: 'Vendredi' },
  6: { short: 'Sa', long: 'Samedi' },
  7: { short: 'Di', long: 'Dimanche' }
}

export function getDaysForMonth(month) {
  const start = month.startOf('month').startOf('week')
  const end = month.endOf('month').endOf('week').startOf('day')
  let cursor = start.startOf('day')
  const today = DateTime.local().toISODate()
  const days = []

  for (let i = 0; i <= 41; i++) {
    const day = {
      date: cursor,
      iso: cursor.toISODate(),
      weekday: WEEKDAYS[cursor.weekday].short,
      day: cursor.day,
      dof: cursor.weekday,
      classes: []
    }

    day.classes.push('calendar-dow-' + day.dof)
    day.classes.push('calendar-day-' + day.iso)

    if (day.iso < today) {
      day.classes.push('past')
    } else if (day.iso === today) {
      day.classes.push('today')
    }

    if (cursor.month !== month.month) {
      day.classes.push('adjacent-month')
    }

    if (cursor > end) {
      day.classes.push('hidden')
    }

    days.push(day)

    cursor = cursor.plus({ day: 1 })
  }

  return days
}

export function updateDaysForMonth(days, month) {
  const start = month.startOf('month').startOf('week')
  const end = month.endOf('month').endOf('week').startOf('day')
  let cursor = start.startOf('day')
  const today = DateTime.local().toISODate()

  for (let i = 0; i <= 41; i++) {
    const day = {
      tag: '',
      allday: false,
      label: '',
      date: cursor,
      iso: cursor.toISODate(),
      weekday: WEEKDAYS[cursor.weekday].short,
      day: cursor.day,
      dof: cursor.weekday,
      classes: [],
      events: []
    }

    day.classes.push('calendar-dow-' + day.dof)
    day.classes.push('calendar-day-' + day.iso)

    if (day.iso < today) {
      day.classes.push('past')
    } else if (day.iso === today) {
      day.classes.push('today')
    }

    if (cursor.month !== month.month) {
      day.classes.push('adjacent-month')
    }

    if (cursor > end) {
      day.classes.push('hidden')
    }

    Object.assign(days[i], day)

    cursor = cursor.plus({ day: 1 })
  }

  return days
}

export function getBlankCalendarDays() {
  const days = []
  const now = DateTime.local()
  for (let i = 0; i <= 41; i++) {
    const dow = (i % 7) + 1
    days.push({
      index: i,
      tag: '',
      allday: false,
      label: '',
      date: now,
      iso: i,
      weekday: WEEKDAYS[dow].short,
      day: '',
      dof: dow,
      classes: [],
      events: []
    })
  }
  return days
}

export async function getEvents({ userId, start, end }) {
  return Events.getInterval(userId, start, end)
}

export function isAlldayTag(tag) {
  return includes(ALLDAY_TAGS, tag)
}

export function eventClass(evt, date) {
  const classes = [evt.tag]
  const dt = DateTime.fromISO(date)

  if (isAlldayTag(evt.tag)) {
    classes.push('allday')
  }

  if (evt.start < dt) {
    classes.push('sp-l')
  }

  if (evt.end > dt.endOf('day')) {
    classes.push('sp-r')
  }

  return classes
}

/**
 * Return the events for the given date
 * @param {Array} events
 * @param {DateTime} date
 * @return {Array}
 */
export function filterEventsByDate(events, date) {
  const startOfDay = date.startOf('day')
  const endOfDay = date.endOf('day')
  return filter(events, evt => {
    return evt.start < endOfDay && evt.end > startOfDay
  })
}
