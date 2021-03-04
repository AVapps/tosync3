import { DateTime, Settings } from 'luxon'
import { Events } from '@/model/Events'

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
  7: { short: 'Di', long: 'Dimanche' },
}

export function updateDaysForMonth(days, month) {
  const start = month.startOf('month').startOf('week')
  const end = month.endOf('month').endOf('week')
  let cursor = start
  const now = DateTime.local()

  for (let i = 0; i <= 41; i++) {
    const day = {
      tag: '',
      allday: false,
      label: '',
      date: cursor,
      iso: cursor.toFormat("yyyy-MM-dd"),
      weekday: WEEKDAYS[cursor.weekday].short,
      day: cursor.day,
      dof: cursor.weekday,
      classes: [],
      events: []
    }

    day.classes.push('calendar-dow-' + day.dof)
    day.classes.push('calendar-day-' + day.iso)

    if (cursor.startOf('day') < now.startOf('day')) {
      day.classes.push('past')
    } else if (cursor.hasSame(now, 'day')) {
      day.classes.push('today')
    }

    if (cursor.startOf('month') < month.startOf('month')) {
      day.classes.push('adjacent-month', 'prev-month')
    } else if (cursor.startOf('month') > month.startOf('month')) {
      day.classes.push('adjacent-month', 'next-month')
    }

    if (cursor.startOf('day') > end.startOf('day')) {
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