import { DateTime, Interval, Settings } from 'luxon'
import { includes, filter, has, first, last, reduce, find, isEmpty } from 'lodash'
import { Events } from '@/model/Events'
import { ALLDAY_TAGS } from '@/data/tags'
import { tagLabel } from '@/helpers/events'

import _ from 'lodash'

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
  const startOfDay = date.startOf('day').toISO()
  const endOfDay = date.endOf('day').toISO()
  return filter(events, evt => {
    return evt.start < endOfDay && evt.end > startOfDay
  })
}

export function getDayParams({ events, date }) {
  // console.log('getDayParams', events)
  if (!events.length || !has(first(events), 'tag')) {
    return { tags: [], allday: true, label: '', hints: [] }
  }

  const day = DateTime.fromISO(date, { zone: TIMEZONE })

  if (events.length === 1 && isAlldayTag(events[0].tag)) {
    const evt = events[0]
    const tag = evt.tag
    const tags = [tag]

    if (DateTime.fromISO(evt.start).startOf('day') < day.startOf('day')) {
      tags.push('sp-l')
    }

    if (DateTime.fromISO(evt.end).endOf('day') > day.endOf('day')) {
      tags.push('sp-r')
    }

    return {
      tags: tags,
      allday: true,
      label: tagLabel(tag),
      hints: [tag]
    }
  }

  const amInterval = Interval.fromDateTimes(day.startOf('day'), day.set({ hour: 11, minute: 59, second: 59 }))
  const pmInterval = Interval.fromDateTimes(day.set({ hour: 12, minute: 0 }), day.endOf('day'))

  const { am: amEvents, pm: pmEvents } = reduce(events, ({ am, pm }, evt) => {
    const debut = DateTime.fromISO(evt.start)
    const fin = DateTime.fromISO(evt.end)
    const interval = Interval.fromDateTimes(debut, fin)
    if (interval.overlaps(amInterval)) {
      am.push(evt)
    }
    if (interval.overlaps(pmInterval)) {
      pm.push(evt)
    }
    return { am, pm }
  }, { am: [], pm: [] })

  if (events.length === 1 && amEvents.length && pmEvents.length) {
    const evt = events[0]
    const tags = [evt.tag]
    const label = tagLabel(evt.tag)

    if (evt.start < day.toISO()) {
      tags.push('sp-l')
    }

    if (evt.end > pmInterval.end.toISO()) {
      tags.push('sp-r')
    }

    return {
      tags,
      allday: false,
      label,
      hints: [evt.tag]
    }
  }

  const hints = {
    am: findMainTag(amEvents),
    pm: findMainTag(pmEvents)
  }

  const allday = hints.am === hints.pm && isAlldayTag(hints.am)
  const label = allday ? tagLabel(hints.am) : `${tagLabel(hints.am)} / ${tagLabel(hints.pm)}`
  const tags = getTags(events)

  if (amEvents.length && first(amEvents).start < day.toISO()) {
    tags.push('sp-l')
  }

  if (pmEvents.length && last(pmEvents).end > pmInterval.end.toISO()) {
    tags.push('sp-r')
  }

  return {
    tags,
    allday,
    label,
    hints: (allday) ? [hints.am + ' ' + hints.pm] : [hints.am, hints.pm]
  }
}

function findMainTag(events) {
  if (isEmpty(events)) return ''

  const tags = getTags(events)

  if (tags.length === 1) {
    return tags[0]
  }

  if (tags.has('rotation') || tags.has('sv')) {
    return 'rotation'
  }

  const specialCategoryEventTag = find(tags, tag => includes(['simu', 'instructionSol', 'instructionSimu', 'stage', 'delegation', 'reserve'], tag))
  return specialCategoryEventTag || first(tags)
}

function getTags(events) {
  return Array.from(
    events.reduce((set, evt) => set.add(evt.tag), new Set())
  )
}

