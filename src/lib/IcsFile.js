import { saveAs } from 'file-saver'
import { DateTime } from 'luxon'
import _ from 'lodash'

const ISO_DATETIME_FORMAT = { format: 'basic', suppressMilliseconds: true }
const ISO_DATE_FORMAT = { format: 'basic' }

export class IcsFile {
  constructor(events) {
    this.events = events
    this.vcalendar = ''
  }

  generate({ categories: tags, content }) {
    this.calArray = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'METHOD:PUBLISH',
      'PRODID:-//TO.Sync//AVapps//FR'
    ]

    this.daysMap = []
    this.DTSTAMP = DateTime.utc().startOf('minute').toISO(ISO_DATETIME_FORMAT)

    _.forEach(this.events, (event) => {
      switch (event.tag) {
        case 'rotation': {
          const vevent = this.startVEvent(event)
          vevent.push(
            'DTSTART;VALUE=DATE:' + DateTime.fromMillis(event.start).startOf('day').toISODate(ISO_DATE_FORMAT),
            'DTEND;VALUE=DATE:' + DateTime.fromMillis(event.end).startOf('day').plus({ day: 1 }).toISODate(ISO_DATE_FORMAT),
            'CATEGORIES:' + event.tag.toUpperCase(),
            'SUMMARY:' + event.summary,
            'DESCRIPTION:' + event.description.replace(/\n/g, '\\n')
          )
          this.endVEvent(vevent)
          break
        }
        case 'vol':
        case 'mep': {
          const vevent = this.startVEvent(event)
          this.addDateTimes(event, vevent)
          vevent.push(
            'CATEGORIES:' + event.tag.toUpperCase(),
            'SUMMARY:' + event.summary,
            'DESCRIPTION:' + event.description.replace(/\n/g, '\\n')
          )
          this.endVEvent(vevent)
          break
        }
        default :
          if (event.isAllDay) {
            if (this.skip(event)) return
            const vevent = this.startVEvent(event)
            this.addDates(event, vevent)
            vevent.push(
              'CATEGORIES:' + event.tag.toUpperCase(),
              'SUMMARY:' + event.summary,
              'DESCRIPTION:' + event.description.replace(/\n/g, '\\n')
            )
            this.endVEvent(vevent)
          } else {
            const vevent = this.startVEvent(event)
            this.addDateTimes(event, vevent)
            vevent.push(
              'CATEGORIES:' + event.tag.toUpperCase(),
              'SUMMARY:' + event.summary,
              'DESCRIPTION:' + event.description.replace(/\n/g, '\\n')
            )
            this.endVEvent(vevent)
          }
          break
      }
    })

    this.calArray.push('END:VCALENDAR')
    this.vcalendar = this.calArray.join('\r\n')
    return this.vcalendar
  }

  save(filename = 'TOSync_plannning.ics') {
    const blob = new Blob([this.vcalendar], { type: 'text/calendar' })
    saveAs(blob, filename)
  }

  skip(evt) {
    const date = DateTime.fromMillis(evt.start).toISODate()
    const _skip = _.includes(this.daysMap, date)
    if (!_skip) this.daysMap.push(date)
    return _skip
  }

  startVEvent(evt) {
    return ['BEGIN:VEVENT', 'UID:' + evt.uid, 'DTSTAMP:' + this.DTSTAMP]
  }

  addDates(evt, vevt) {
    const startDate = DateTime.fromMillis(evt.start, { zone: 'Europe/Paris' }).startOf('day')
    vevt.push('DTSTART;VALUE=DATE:' + startDate.toISODate(ISO_DATE_FORMAT))
    const endDate = DateTime.fromMillis(evt.end, { zone: 'Europe/Paris' }).startOf('day').plus({ day: 1 })
    vevt.push('DTEND;VALUE=DATE:' + endDate.toISODate(ISO_DATE_FORMAT))
    return vevt
  }

  addDateTimes(evt, vevt) {
    vevt.push('DTSTART;VALUE=DATE-TIME:' + DateTime.fromMillis(evt.start).toUTC().toISO(ISO_DATETIME_FORMAT))
    vevt.push('DTEND;VALUE=DATE-TIME:' + DateTime.fromMillis(evt.end).toUTC().toISO(ISO_DATETIME_FORMAT))
    return vevt
  }

  endVEvent(vevt) {
    vevt.push('END:VEVENT')
    this.calArray.push(vevt.join('\r\n'))
    return vevt
  }
}
