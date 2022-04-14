import { DateTime, Settings } from 'luxon'

const TIMEZONE = 'Europe/Paris'
Settings.defaultLocale = 'fr'
Settings.defaultZoneName = TIMEZONE

export function lastPublishedDay() {
  const now = DateTime.local()
  return now
    .set({ weekday: now.weekday <= 5 ? -2 : 5 })
    .plus({ days: 31 })
    .endOf('day')
}