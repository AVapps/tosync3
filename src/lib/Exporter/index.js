import allday from './templates/allday.js'
import event from './templates/event.js'
import rotation from './templates/rotation.js'
import vol from './templates/vol.js'
import { nbjours, decouchers } from './templates/helpers.js'

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
  allday,
  event,
  rotation,
  vol
}

// Capitalise first letter of all words in string
function capitalize(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

// get the template for the given type
function getTemplate(type) {
  return exportTemplates[type] || 'event'
}

function getTitleTemplate(type, useLegacyFormat) {
  if (useLegacyFormat && titleTemplatesLegacy[type]) {
    return titleTemplatesLegacy[type]
  }
  if (titleTemplates[type]) {
    return titleTemplates[type]
  }
  return evt => evt.summary
}

// get template function for given event type
function getTemplateFunction(type) {
  return templateFunctions[getTemplate(type)]
}

// Render the given event with the right template
export function renderEventDescription(event, options) {
  return getTemplateFunction(event.tag)(event, options)
}

const titleTemplatesLegacy = {
  rotation: rot => `Rotation ${nbjours(rot)}ON du ${DateTime.fromMillis(rot.start).toFormat('D MMMM')}`,
  vol: vol => `${vol.num} | ${vol.from} - ${vol.to}`,
  mep: mep => `${mep.num || mep.summary} | ${mep.from} - ${mep.to} | MEP`
}

const titleTemplates = {
  rotation: rot => {
    let str = `Rotation ${nbjours(rot)}ON`
    const d = decouchers(rot)
    if (d) {
      str += ` ${d}`
    }
    return str
  },
  vol: vol => `${vol.num} (${vol.from}-${vol.to})`,
  mep: mep => `MEP : ${mep.num || mep.summary} (${mep.from}-${mep.to})`,
  absence: evt => capitalize(evt.summary),
  conges: evt => 'Congés',
  sanssolde: evt => 'Sans solde',
  blanc: evt => 'Blanc',
  jisap: evt => 'JISAP',
  repos: evt => 'Repos',
  maladie: evt => 'Arrêt maladie',
  greve: evt => 'Grève',
  stage: evt => capitalize(evt.summary),
  sol: evt => capitalize(evt.summary),
  instructionSol: evt => capitalize(evt.summary),
  simu: evt => capitalize(evt.summary),
  instructionSimu: evt => capitalize(evt.summary),
  reserve: evt => capitalize(evt.summary),
  delegation: evt => 'Syndicat',
  npl: evt => 'Non planifiable',
  autre: evt => capitalize(evt.summary)
}

export function renderEventTitle(event, options) {
  return getTitleTemplate(event.tag, options.useLegacyFormat)(event)
}
