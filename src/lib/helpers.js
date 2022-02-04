import { DateTime, Settings } from 'luxon'

const LOCALE = 'fr'
const TIMEZONE = 'Europe/Paris'

Settings.defaultLocale = LOCALE
Settings.defaultZoneName = TIMEZONE

export function tsToTime(ts) {
  return DateTime.fromMillis(ts, {
    locale: LOCALE,
    zone: TIMEZONE
  }).toFormat('HH:mm')
}
