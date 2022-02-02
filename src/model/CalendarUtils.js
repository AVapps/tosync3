import _ from 'lodash'
import { ALLDAY_TAGS, tagLabel } from '@/lib/Utils'
import { DateTime, Interval } from 'luxon'

const TIMEZONE = 'Europe/Paris'

export function isAlldayTag(tag) {
  return _.includes(ALLDAY_TAGS, tag)
}

export function getDayParams({ events, date }) {
  // console.log('getDayParams', events)
  if (!events.length || !_.has(_.first(events), 'tag')) {
    return { tags: [], allday: true, label: '', hints: [] }
  }

  const day = DateTime.fromISO(date, { zone: TIMEZONE })

  if (events.length === 1 && isAlldayTag(events[0].tag)) {
    const evt = events[0]
    const tag = evt.tag
    const tags = [tag]

    if (evt.start < day) {
      tags.push('sp-l')
    }
    if (evt.end > day.endOf('day')) {
      tags.push('sp-r')
    }

    return {
      tags: tags,
      allday: true,
      label: tagLabel(tag),
      hints: [tag]
    }
  }

  const amInterval = Interval.fromDateTimes(day.startOf('day'), day.set({ hour: 11, minute: 59, second: 59 }))
  const pmInterval = Interval.fromDateTimes(day.set({ hour: 12, minute: 0 }), day.endOf('day'))

  const { am: amEvents, pm: pmEvents } = _.reduce(events, ({ am, pm }, evt) => {
    const debut = DateTime.fromMillis(evt.start)
    const fin = DateTime.fromMillis(evt.end)
    const interval = Interval.fromDateTimes(debut, fin)
    if (interval.overlaps(amInterval)) {
      am.push(evt)
    }
    if (interval.overlaps(pmInterval)) {
      pm.push(evt)
    }
    return { am, pm }
  }, { am: [], pm: [] })

  if (events.length === 1 && amEvents.length && pmEvents.length) {
    const evt = events[0]
    const tags = [evt.tag]
    const label = tagLabel(evt.tag)

    if (evt.start < day.toMillis()) {
      tags.push('sp-l')
    }

    if (evt.end > pmInterval.end.toMillis()) {
      tags.push('sp-r')
    }

    return {
      tags,
      allday: false,
      label,
      hints: [evt.tag]
    }
  }

  const hints = {
    am: findMainTag(amEvents),
    pm: findMainTag(pmEvents)
  }

  const allday = hints.am === hints.pm && isAlldayTag(hints.am)
  const label = allday ? tagLabel(hints.am) : `${tagLabel(hints.am)} / ${tagLabel(hints.pm)}`
  const tags = getTags(events)

  if (amEvents.length && _.first(amEvents).start < day.toMillis()) {
    tags.push('sp-l')
  }

  if (pmEvents.length && _.last(pmEvents).end > pmInterval.end.toMillis()) {
    tags.push('sp-r')
  }

  return {
    tags,
    allday,
    label,
    hints: (allday) ? [hints.am + ' ' + hints.pm] : [hints.am, hints.pm]
  }
}

function findMainTag(events) {
  if (_.isEmpty(events)) return ''

  const tags = getTags(events)

  if (tags.length === 1) {
    return tags[0]
  }

  if (tags.has('rotation') || tags.has('sv')) {
    return 'rotation'
  }

  const specialCategoryEventTag = _.find(tags, tag => _.includes(['simu', 'instructionSol', 'instructionSimu', 'stage', 'delegation', 'reserve'], tag))
  return specialCategoryEventTag || _.first(tags)
}

function getTags(events) {
  return Array.from(
    events.reduce((set, evt) => set.add(evt.tag), new Set())
  )
}
