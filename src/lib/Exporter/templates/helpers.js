import { DateTime } from 'luxon'

function tsToDateTime(ts) {
  return DateTime.fromMillis(ts)
}

export function tsToDateTimeString(ts) {
  return tsToDateTime(ts).toLocaleString(DateTime.DATETIME_FULL)
}

export function tsToDateString(ts) {
  return tsToDateTime(ts).toLocaleString(DateTime.DATE_FULL)
}

export function nbjours(evt) {
  const start = tsToDateTime(evt.start)
  const end = tsToDateTime(evt.end)
  return end.startOf('day').diff(start.startOf('day'), 'days').as('days') + 1
}

export function decouchers(rotation) {
  // TODO map sv hotels
  return ''
}

export function duree(evt) {
  const start = tsToDateTime(evt.start)
  const end = tsToDateTime(evt.end)
  const duration = end.diff(start, ['hours', 'minutes'])
  return duration.toFormat('hh:mm')
}
