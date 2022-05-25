import _ from 'lodash'
import { DateTime } from 'luxon'

import { CATEGORIES } from '@/data/categories'
import { CODES_INSTRUCTION } from '@/data/codes-instruction'

export function tagLabel(tag) {
  switch (tag) {
    case 'rotation':
      return 'Rotation'
    case 'vol':
      return 'Vol'
    case 'sv':
      return 'SV'
    case 'mep':
      return 'MEP'
    case 'conges':
      return 'Congés'
    case 'sanssolde':
      return 'Sans solde'
    case 'repos':
      return 'Repos'
    case 'jisap':
      return 'JISAP'
    case 'maladie':
      return 'Maladie'
    case 'greve':
      return 'Grève'
    case 'stage':
      return 'Stage'
    case 'instruction':
      return 'Instruction'
    case 'instructionSol':
      return 'Instruction Sol'
    case 'simu':
      return 'Simu'
    case 'instructionSimu':
      return 'Instruction Simu'
    case 'reserve':
      return 'Réserve'
    case 'syndicat':
    case 'delegation':
      return 'Syndicat'
    case 'sol':
      return 'Activité sol'
    case 'npl':
      return 'NPL'
    case 'autre':
      return 'Autre'
    default:
      return ucfirst(tag)
  }
}

export function slug(event, username, index) {
  username = username || event.userId
  const prefix = username + DateTime.fromISO(event.start).toISODate({ format: 'basic' })
  const suffix = event.tag + (index || '')

  if (_.has(event, 'events') && !_.isEmpty(event.events)) {
    // Duty sol ou vol
    switch (event.tag) {
      case 'sv':
      case 'mep':
        return svSlug(event, prefix, suffix)
      default:
        const first = _.first(event.events)
        const description = first.category || first.summary.replace(/\W+/g, '_')
        return [prefix, description, DateTime.fromISO(event.start).toFormat('HHmm'), suffix].join('-')
    }
  } else {
    switch (event.tag) {
      case 'rotation':
      case 'repos':
      case 'conges':
      case 'maladie':
      case 'greve':
      case 'sanssolde':
      case 'blanc':
      case 'jisap':
      case 'npl':
      case 'absence':
        return alldayEventSlug(event, prefix, suffix)
      case 'vol':
        return [prefix, event.num, event.from, event.to, suffix].join('-')
      case 'mep':
        return [prefix, (event.num || event.summary || '').replace(/\W+/g, '_'), event.from, event.to, suffix].join('-')
      default:
        return [prefix, event.category || event.summary.replace(/\W+/g, '_'), DateTime.fromISO(event.start).toFormat('HHmm'), suffix].join('-')
    }
  }
}

export function findActivityTag(activity) {
  switch (activity.activityType) {
    case 'F':
      return 'vol'
    case 'S':
    case 'P':
    case 'O':
    case 'T':
      return 'mep'
    case 'H':
      return 'hotel'
    case 'G':
    default:
      if (activity.groundCode) {
        return findTag(activity.groundCode)
      } else {
        return 'autre'
      }
  }
}

export function findChangeTag(change) {
  switch (change.newType) {
    case 'F':
      return 'vol'
    case 'S':
    case 'P':
    case 'O':
    case 'T':
      return 'mep'
    case 'H':
      return 'hotel'
    case 'G':
    default:
      if (change.groundCode) {
        return findTag(change.groundCode)
      } else {
        return 'autre'
      }
  }
}

export async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

export function ucfirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function findTag(code) {
  return findInObject(CATEGORIES, code) || 'autre'
}

export function findCodeInstruction(code) {
  return findInObject(CODES_INSTRUCTION, code)
}

function findInObject(object, code) {
  if (_.has(object, code)) {
    return _.get(object, code)
  }

  if (code.length > 2 && /\d$/.test(code) && _.has(object, code.substring(0, code.length - 1))) {
    return _.get(object, code.substring(0, code.length - 1))
  }

  const shortCode = code.includes('_') ? code.replace(/_/g, '') : undefined
  if (shortCode) {
    if (_.has(object, shortCode)) {
      return _.get(object, shortCode)
    }

    const subCode = code.split('_')[0]
    if (_.has(object, subCode)) {
      const tag = _.get(object, subCode)
      console.log(`---  Tag attribué (méthode sub) : ${tag} [${code}] ---`)
      return tag
    }
  }

  const found = _.find(object, (tag, _code) => {
    return _code.includes(code) || code.includes(_code) || (shortCode && (_code.includes(code.split('_')[0]) || _code.replace(/_/g, '').includes(shortCode)))
  })

  if (found) {
    console.log(`---  Tag attribué (méthode recherche) : ${found} [${code}] ---`)
    return found
  }
  console.log('!!! IMPOSSIBLE DE DETERMINER TAG !!!', code)
}

function svSlug(event, prefix, suffix) {
  const first = _.first(event.events)
  const title = (first.num || first.title).replace(/\W+/g, '-')
  return [prefix, title, first.from, first.to, suffix].join('-')
}

function alldayEventSlug(event, prefix, suffix) {
  const endDate = DateTime.fromISO(event.end)
  if (endDate.hasSame(event.start, 'day')) {
    return [prefix, suffix].join('-')
  } else {
    return [prefix, endDate.toISODate({ format: 'basic' }), suffix].join('-')
  }
}
