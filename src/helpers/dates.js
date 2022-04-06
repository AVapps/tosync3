import { DateTime, Settings } from 'luxon'
import { first as _first, last as _last } from 'lodash'
import { checkISODate, checkISOMonth } from './check'

const LOCALE = 'fr'
const TIMEZONE = 'Europe/Paris'

Settings.defaultLocale = LOCALE
Settings.defaultZoneName = TIMEZONE

export function toDateTime(date) {
  if (DateTime.isDateTime(date)) {
    return date.setZone(TIMEZONE)
  }
  if (typeof date === 'number') {
    return DateTime.fromMillis(date, { zone: TIMEZONE })
  }
  if (typeof date === 'string') {
    checkISODate(date)
    return DateTime.fromISO(date, { zone: TIMEZONE })
  }
  if (date instanceof Date) {
    return DateTime.fromJSDate(date, { zone: TIMEZONE })
  }
  throw new Error('You must provide a valid date !')
}

export function toISODate(date) {
  if (DateTime.isDateTime(date)) {
    return date.toISODate()
  } else if (typeof date === 'string') {
    checkISODate(date)
    return date
  } else if (typeof date === 'number') {
    return DateTime.fromMillis(date, { zone: TIMEZONE }).toISODate()
  } else if (date instanceof Date) {
    return DateTime.fromJSDate(date, { zone: TIMEZONE }).toISODate()
  } else {
    throw new Error('You must provide a valid date !')
  }
}

export function toISOMonth(date) {
  if (DateTime.isDateTime(date)) {
    return date.toISODate().substring(0, 7)
  } else if (typeof date === 'string') {
    checkISOMonth(date)
    return date.substring(0, 7)
  } else if (typeof date === 'number') {
    return DateTime.fromMillis(date, { zone: TIMEZONE }).toISODate().substring(0, 7)
  } else if (date instanceof Date) {
    return DateTime.fromJSDate(date, { zone: TIMEZONE }).toISODate().substring(0, 7)
  } else {
    throw new Error('You must provide a valid date/month !')
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

export function tsToTime(ts, tz = TIMEZONE) {
  return DateTime.fromMillis(ts, {
    locale: LOCALE,
    zone: tz
  }).toFormat('HH:mm')
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

export function getDutyStart(events) {
  const first = _first(events)
  const debut = DateTime.fromMillis(first.start)

  if (first.tag === 'vol') {
    switch (first.from) {
      case 'ORY':
      case 'LYS':
        return debut.minus({ minutes: 75 }).toMillis()
      case 'TLV':
        return debut.minus({ minutes: 80 }).toMillis()
      default:
        return debut.minus({ minutes: 60 }).toMillis()
    }
    // +15 min pour les vols à dest. de KEF, KTT, RVN et IVL pour les PNT seulement
  } else if (first.tag === 'mep') {
    return debut.minus({ minutes: 15 }).toMillis()
  } else if (first.tag === 'simu') {
    return debut.minus({ minutes: 60 }).toMillis()
  } else {
    return first.start
  }
}

export function getDutyEnd(events) {
  const last = _last(events)
  switch (last.tag) {
    case 'vol': {
      const realEnd = last.real && last.real.end ? last.real.end : last.end
      return DateTime.fromMillis(realEnd).plus({ minutes: 30 }).toMillis()
    }
    case 'simu':
    case 'simuInstruction': {
      return DateTime.fromMillis(last.end).plus({ minutes: 30 }).toMillis()
    }
    default:
      return last.end
  }
}
