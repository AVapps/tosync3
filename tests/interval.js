import { DateTime, Interval } from 'luxon'

const start = DateTime.fromISO('2021-05-01')
const end = DateTime.fromISO('2021-05-31').endOf('day')

const interval = Interval.fromDateTimes(start, end)

console.log(interval.toISODate())

const date = DateTime.fromISO('2021-05-31T23:59:59+02:00')

console.log(interval.contains(date))

const interval2 = Interval.fromISO('2021-06-01/2021-06-30')

console.log(interval2.toISO())
