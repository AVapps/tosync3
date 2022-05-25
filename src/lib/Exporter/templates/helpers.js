import { DateTime } from 'luxon'
import { toDateTime } from '@/helpers/dates'

export function nbjours(evt) {
  const start = toDateTime(evt.start)
  const end = toDateTime(evt.end)
  return end.startOf('day').diff(start.startOf('day'), 'days').as('days') + 1
}

export function decouchers(rotation) {
  // TODO map sv hotels
  return ''
}

export function duree(evt) {
  const start = toDateTime(evt.start)
  const end = toDateTime(evt.end)
  const duration = end.diff(start, ['hours', 'minutes'])
  return duration.toFormat('hh:mm')
}
