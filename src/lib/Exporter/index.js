import allday from './templates/allday'
import event from './templates/event'
import rotation from './templates/rotation'
import vol from './templates/vol'

import { template, uniq } from 'lodash'
import { DateTime } from 'luxon'

const exportTemplates = {
  rotation: 'rotation',
  vol: 'vol',
  mep: 'event',
  absence: 'allday',
  conges: 'allday',
  sanssolde: 'allday',
  blanc: 'allday',
  jisap: 'allday',
  repos: 'allday',
  maladie: 'allday',
  greve: 'allday',
  stage: 'event',
  sol: 'event',
  instructionSol: 'event',
  simu: 'event',
  instructionSimu: 'event',
  reserve: 'event',
  delegation: 'event',
  npl: 'allday',
  autre: 'event'
}

const templateFunctions = {
  allday: template(allday),
  event: template(event),
  rotation: template(rotation),
  vol: template(vol)
}

// get the template for the given type
function getTemplate(type) {
  return exportTemplates[type] || 'event'
}

// get template function for given event type
function getTemplateFunction(type) {
  return templateFunctions[getTemplate(type)]
}

// Render the given event with the right template
export function renderEvent(event, options) {
  return getTemplateFunction(event.tag)(event, options)
}

const titleTemplates = {
  rotation: rot => `Rotation ${rot.nbjoursTO}ON du ${DateTime.fromMillis(rot.start).toFormat('D MMMM')}`,
  vol: vol => `${vol.num} | ${vol.from} - ${vol.to} | ${vol.type}`,
  mep: mep => `${mep.num || mep.title} | ${mep.from} - ${mep.to} | MEP`
}

const titleTemplatesCM = {
  rotation: rot => {
    let str = `Rotation - ${rot.nbjoursTO}ON`
    if (rot.decouchers.length) {
      str += ' - ' + uniq(rot.decouchers.map('to')).join(' - ')
    }
    return str
  },
  vol: vol => `${vol.num} (${vol.from}-${vol.to}) ${vol.type}`,
  mep: mep => `MEP : ${mep.num || mep.title} (${mep.from}-${mep.to})`
}

export function renderTitle(event, options) {
  switch (event.tag) {
    case 'rotation':
      return options.useCMFormat ? titleTemplatesCM.rotation(event) : titleTemplates.rotation(event)
    case 'vol':
      return options.useCMFormat ? titleTemplatesCM.vol(event) : titleTemplates.vol(event)
    case 'mep':
      return options.useCMFormat ? titleTemplatesCM.mep(event) : titleTemplates.mep(event)
    default:
      return event.title
  }
}
