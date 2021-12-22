import { isEmpty, filter, get, keys } from 'lodash'
import { renderEventDescription, renderEventTitle } from './Exporter'

import { Events } from '@/model/Events'

const SYNC_CATEGORIES = {
  vol: ['vol', 'mep'],
  rotation: ['rotation'],
  repos: ['repos'],
  conges: ['conges'],
  sol: ['sol', 'stage', 'simu', 'reserve', 'delegation', 'autre'],
  instruction: ['instructionSol', 'instructionSimu'],
  sanssolde: ['absence', 'sanssolde', 'greve'],
  maladie: ['maladie'],
  blanc: ['blanc', 'jisap', 'npl']
}

const SYNC_CATEGORIES_LABEL = {
  vol: 'Vols',
  rotation: 'Rotations',
  repos: 'Repos',
  conges: 'Congés',
  sol: 'Activités sol',
  instruction: 'Instruction',
  sanssolde: 'Sans solde',
  maladie: 'Maladie',
  blanc: 'Blancs'
}

const SYNC_TAG_CATEGORIES = {
  rotation: 'rotation',
  vol: 'vol',
  mep: 'vol',
  absence: 'sanssolde',
  conges: 'conges',
  sanssolde: 'sanssolde',
  blanc: 'blanc',
  jisap: 'blanc',
  npl: 'blanc',
  repos: 'repos',
  maladie: 'maladie',
  greve: 'sanssolde',
  stage: 'sol',
  sol: 'sol',
  instructionSol: 'instruction',
  simu: 'sol',
  instructionSimu: 'instruction',
  reserve: 'sol',
  delegation: 'sol',
  autre: 'sol'
}

export function getSyncCategorie(tag) {
  return get(SYNC_TAG_CATEGORIES, tag)
}

export function getSyncCategories() {
  return keys(SYNC_CATEGORIES)
}

export function getSyncCategoryLabel(tag) {
  return get(SYNC_CATEGORIES_LABEL, tag)
}

export function filterEventsByTags(events, tags) {
  return isEmpty(tags)
    ? []
    : filter(events, (evt) => {
      const syncCategorie = get(SYNC_TAG_CATEGORIES, evt.tag)
      return tags.includes(syncCategorie)
    })
}

export function transformEventsToSync(events, options = {}) {
  return events.map((evt) => {
    return {
      id: evt.id,
      title: renderEventTitle(evt, options),
      description: renderEventDescription(evt, options),
      start: evt.start,
      end: evt.end
    }
  })
}

/**
 * Get events between two dates for given userId and transform them to export format
 * @param {string} userId
 * @param {any} startDate
 * @param {any} endDate
 */
export async function getEventsToSync(userId, startDate, endDate, categories) {
  let eventsToSync = await Events.getInterval(userId, startDate, endDate)
  eventsToSync = filterEventsByTags(eventsToSync, categories)
  eventsToSync = transformEventsToSync(eventsToSync)
  return eventsToSync
}
