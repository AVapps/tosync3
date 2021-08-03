import _ from 'lodash'
import { ALLDAY_TAGS, tagLabel } from '@/lib/Utils'

export function isAlldayTag(tag) {
  return _.includes(ALLDAY_TAGS, tag)
}

export function getDayParams(events) {
  // console.log('getDayParams', events)
  if (!events.length || !_.has(_.first(events), 'tag')) {
    return { tags: ['blanc'], allday: true, label: 'Blanc' }
  }

  const tagsSet = new Set()
  _.forEach(events, evt => tagsSet.add(evt.tag))
  const tags = [...tagsSet]

  if (tagsSet.size === 1) {
    const tag = tags[0]
    return {
      tags,
      allday: isAlldayTag(tag),
      label: tagLabel(tag)
    }
  }

  const hasRotation = tags.has('rotation') || tags.has('sv')
  if (hasRotation) {
    return {
      tags,
      allday: false,
      label: 'Rotation'
    }
  }

  const specialCategoryEventTag = _.find(tags, tag => _.includes(['simu', 'instructionSol', 'instructionSimu', 'stage', 'delegation', 'reserve'], tag))
  const tag = specialCategoryEventTag || _.first(tags)
  return { tags, allday: isAlldayTag(tag), label: tagLabel(tag) }
}
