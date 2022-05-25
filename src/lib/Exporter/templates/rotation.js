import { toLocaleString } from '@/helpers/dates'
import { DateTime } from 'luxon'

export default function (evt) {
  return `Début : ${toLocaleString(evt.start, DateTime.DATETIME_FULL)}\nFin : ${toLocaleString(evt.end, DateTime.DATETIME_FULL)}`
}
