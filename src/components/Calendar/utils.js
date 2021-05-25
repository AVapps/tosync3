import { DateTime, Settings } from 'luxon'
import _ from 'lodash'
import { Events } from '@/model/Events'
import { ALLDAY_TAGS, tagLabel } from '@/lib/Utils'

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

export function getDayParams(events) {
  // console.log('getDayParams', events)
  const hasRotation = _.some(events, evt => {
    return _.includes(['rotation', 'sv'], evt.tag)
  })
  if (hasRotation) {
    return {
      tag: 'rotation',
      allday: false,
      label: 'Rotation'
    }
  }

  if (!events.length || !_.has(_.first(events), 'tag')) {
    return { tag: 'blanc', allday: true, label: 'Blanc' }
  }

  const specialCategoryEvent = _.find(events, evt => _.includes(['simu', 'instructionSol', 'instructionSimu', 'stage', 'delegation', 'reserve'], evt.tag))
  const tag = specialCategoryEvent ? specialCategoryEvent.tag : _.first(events).tag
  return { tag, allday: isAlldayTag(tag), label: tagLabel(tag) }
}

export function isAlldayTag(tag) {
  return _.includes(ALLDAY_TAGS, tag)
}

export function eventClass(evt, date) {
  const classes = [evt.tag]

  if (isAlldayTag(evt.tag)) {
    classes.push('allday')
  }

  if (evt.start < date) {
    classes.push('span-left')
  }

  if (evt.end > date.endOf('day')) {
    classes.push('span-right')
  }

  return classes
}
