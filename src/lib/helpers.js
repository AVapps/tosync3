import { DateTime, Settings } from 'luxon'

const LOCALE = 'fr'
const TIMEZONE = 'Europe/Paris'

Settings.defaultLocale = LOCALE
Settings.defaultZoneName = TIMEZONE

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
