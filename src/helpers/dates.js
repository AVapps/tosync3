import { DateTime, Settings } from 'luxon'
import { first as _first, last as _last } from 'lodash'
import { checkISODate, checkISOMonth } from './check'

const LOCALE = 'fr'
const TIMEZONE = 'Europe/Paris'

Settings.defaultLocale = LOCALE
Settings.defaultZoneName = TIMEZONE

export function toDateTime(date, zone = TIMEZONE) {
  if (DateTime.isDateTime(date)) {
    return date.setZone(zone)
  }
  if (typeof date === 'string') {
    return DateTime.fromISO(date, { zone })
  }
  if (typeof date === 'number') {
    return DateTime.fromMillis(date, { zone })
  }
  if (date instanceof Date) {
    return DateTime.fromJSDate(date, { zone })
  }
  throw new Error('You must provide a valid date !')
}

export function toTimeString(date, zone = TIMEZONE) {
  return toDateTime(date, zone).toFormat('HH:mm')
}

export function toISO(date, zone = TIMEZONE) {
  if (typeof date === 'string') {
    return date
  } else {
    return toDateTime(date, zone).toISO()
  }
}

export function toISODate(date, zone = TIMEZONE) {
  if (typeof date === 'string') {
    checkISODate(date)
    return date
  } else {
    return toDateTime(date, zone).toISODate()
  }
}

export function toISOMonth(date, zone = TIMEZONE) {
  if (typeof date === 'string') {
    checkISOMonth(date)
    return date.substring(0, 7)
  } else {
    return toDateTime(date, zone).toISODate().substring(0, 7)
  }
}

export function getIntervalDates(start, end) {
  if (start > end) {
    throw new Error('[utils.getIntervalDates] Start time is greater than end time !')
  }
  const dates = []
  let d = start
  while (d <= end) {
    dates.push(d.toISODate())
    d = d.plus({ day: 1 })
  }
  return dates
}

export const DATETIME_SHORT_FORMAT = { weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }

export function toLocaleString(date, format = DATETIME_SHORT_FORMAT) {
  const datetime = toDateTime(date)
  return datetime.setLocale(LOCALE).toLocaleString(format)
}

export function isoDateToString(date, format = DateTime.DATE_MED_WITH_WEEKDAY) {
  return DateTime.fromISO(date, {
    locale: LOCALE,
    zone: TIMEZONE
  }).toLocaleString(format)
}

const formatter = Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

export function formatNumber(num, { alwaysDisplaySign = false }) {
  if (num === 0) {
    return '0.00'
  }
  const sign = alwaysDisplaySign && num > 0 ? '+' : ''
  return sign + formatter.format(num)
}

/**
 * Takes a float number and returns a string in hours and minutes separated by a specified separator
 * @param {Number} num
 * @param {String} separator
 */
export function formatAsHours(num, separator = 'h') {
  const hours = Math.floor(num)
  const minutes = Math.round((num - hours) * 60)
  return `${hours}${separator}${minutes}`
}
