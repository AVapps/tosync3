import { DateTime, Settings } from 'luxon'
import _ from 'lodash'
import { slug as getSlug } from '@/helpers/events.js'
import {
  rotationSchema,
  svSchema,
  solSchema,
  dutySchema
} from '@/model/index.js'

import { remuForEvent } from '@/lib/Remu/Remu.js'

import { Events } from '@/model/Events.js'

Settings.defaultLocale = 'fr'
Settings.defaultZoneName = 'Europe/Paris'

function isRotation(evt) {
  return evt.tag === 'rotation'
}

/**
 * Importe un planning depuis CrewConnect
 **/
export class CrewConnectPlanningImporter {
  constructor() {
    this.userId = null
    this.userProfile = {}
    this.isPNT = false
    this.savedEvents = []
    this.savedEventsByTag = {}
  }

  initIndexes() {
    this.updateLog = {
      userId: this.userId,
      insert: [],
      update: [], // events avec _id et _rev
      remove: [] // events complets avec _id et _rev
    }
    this.foundIds = new Set()
    this.savedEventsSlugMap = new Map()
    this.savedFlightsSlugMap = new Map()
  }

  async importPlanning({ planning, userId, profile, requestDate }) {
    console.log('CCPlanningImporter.importPlanning', planning, userId)
    this.userId = userId
    this.userProfile = profile
    this.isPNT = /CDB|OPL/.test(profile.contractRoles)

    if (!this.userId) {
      throw new Error('ID utilisateur non défini !')
    }

    this.requestedAt = DateTime.fromISO(requestDate).toMillis()
    this.initIndexes()

    const first = _.first(planning)
    const last = _.last(planning)

    this.savedEvents = await Events.getInterval(this.userId, first.start, last.end)

    this.savedEventsByTag = _.groupBy(this.savedEvents, 'tag')
    console.log('CCPlanningImport.importPlanning savedEvents', this.savedEvents, this.savedEventsByTag)

    // Générer les index Maps
    _.forEach(this.savedEvents, evt => {
      this.savedEventsSlugMap.set(evt.slug, evt)
      if (isRotation(evt)) {
        if (_.isEmpty(evt.sv)) {
          console.log('!!! Rotation sans SV !!!', evt)
        } else {
          _.forEach(evt.sv, sv => {
            this.savedEventsSlugMap.set(sv.slug, sv)
            if (sv.events && sv.events.length) {
              _.forEach(sv.events, sub => {
                sub.slug = getSlug(sub, this.userId)
                this.savedFlightsSlugMap.set(sub.slug, sub)
              })
            } else {
              console.log('!!! SV sans events !!!', sv)
            }
          })
        }
      }
    })

    _.forEach(planning, evt => {
      this.mapDateStringsToTimestamps(evt)
      if (isRotation(evt)) {
        this.importRotation(evt)
      } else if (_.has(evt, 'events')) {
        this.importDutySol(evt)
      } else {
        this.importSol(evt)
      }
    })

    this.removeNotFounds()
    return this.updateLog
  }

  /**
   * Importe tout évènement qui n'est ni un vol, ni une rotation, ni une journée sol (composée de plusieurs évènements)
   * - si l'évènement existe => mettre à jour
   * - sinon l'ajouter
   * @param {*} evt
   */
  importSol(sol) {
    this.completeSol(sol)
    this.matchOrReplaceImport(sol, solSchema)
  }

  importDutySol(duty) {
    this.completeSol(duty)
    this.matchOrReplaceImport(duty, dutySchema)
  }

  importRotation(rot) {
    _.forEach(rot.sv, sv => {
      this.completeSV(sv)
    })
    rot.slug = getSlug(rot, this.userId)
    rot.remu = remuForEvent(rot, this.isPNT)

    const found = this.findSavedEvent(rot)
    if (found) {
      // console.log(`%cFOUND ${rot.slug}`, 'color:green')

      const firstEvent = _.first(_.first(rot.sv)?.events)
      if (firstEvent?.start > this.requestedAt) { // Heures programmées => garder les heures enregistrées précédemment
        rot.start = found.start
        rot.end = found.end
      } else {
        const lastEvent = _.last(_.last(rot.sv)?.events)
        if (lastEvent?.end > this.requestedAt) { // Heure de fin programmée => garder l'heure enregistrée
          rot.end = found.end
        }
      }

      const updateResult = this.matchUpdateFoundEvent(rot, found, rotationSchema)

      _.forEach(rot.sv, sv => {
        sv.rotationId = updateResult._id
        this.importSV(sv)
      })
    } else {
      this.insertRotation(rot)
    }
  }

  insertRotation(rot) {
    // console.log(`%cNOT FOUND ${rot.slug} : inserting...`, 'color: red')

    const cleanedRot = rotationSchema.clean(rot)
    cleanedRot.userId = this.userId
    cleanedRot._id = Events.getId(cleanedRot)
    this.updateLog.insert.push(cleanedRot)

    rot.sv.forEach(sv => {
      sv.rotationId = cleanedRot._id
      this.importSV(sv)
    })
  }

  importSV(sv) {
    const found = this.findSavedEvent(sv)
    if (found) {
      // console.log(`%cFOUND SV ${sv.slug}`, 'color: green')

      const firstEvent = _.first(sv.events)
      if (firstEvent?.start > this.requestedAt) { // Heures programmées => garder les heures enregistrées précédemment
        sv.start = found.start
        sv.end = found.end
      } else {
        const lastEvent = _.last(sv.events)
        if (lastEvent?.end > this.requestedAt) { // Heure de fin programmée => garder l'heure enregistrée
          sv.end = found.end
        }
      }

      return this.matchUpdateFoundEvent(sv, found, svSchema)
    } else {
      // console.log(`%c SV NOT FOUND ${sv.slug} : inserting...`, 'color: red')
      const cleanedSV = svSchema.clean(sv)
      this.updateLog.insert.push(cleanedSV)
      return { ref: cleanedSV }
    }
  }

  completeSV(sv) {
    _.forEach(sv.events, evt => {
      if (evt.tag === 'vol') {
        evt.slug = getSlug(evt, this.userId)
        const savedVol = this.findSavedFlight(evt)
        if (savedVol) {
          if (evt.fin < this.requestedAt) { // Utiliser les heures programmmées du vol enregistré
            evt.std = savedVol.std
            evt.sta = savedVol.sta
          } else { // Utiliser les heures réalisées du vol enregistré
            evt.std = evt.start
            evt.sta = evt.end
            evt.start = savedVol.start
            evt.end = savedVol.end
          }
        } else {
          evt.std = evt.start
          evt.sta = evt.end
        }
      }
    })

    sv.slug = getSlug(sv, this.userId)
  }

  completeSol(sol) {
    sol.slug = getSlug(sol, this.userId)
    const remu = remuForEvent(sol, this.isPNT)
    if (remu) {
      sol.remu = remu
    }
  }

  removeNotFounds() {
    const notFounds = _.filter(this.savedEvents, evt => !this.foundIds.has(evt._id))
    this.updateLog.remove.push(...notFounds)
  }

  async save() {
    if (this.updateLog.insert.length ||
      this.updateLog.update.length ||
      this.updateLog.remove.length) {
      const result = {
        updateLog: this.updateLog,
        result: await Events.processBulkUpdate(this.updateLog)
      }
      this.initIndexes()
      return result
    }
  }

  matchOrReplaceImport(evt, schema) {
    const found = this.findSavedEvent(evt)
    if (found) {
      // console.log(`%cFOUND ${evt.slug}`, 'color: green')
      return this.matchUpdateFoundEvent(evt, found, schema)
    } else {
      // console.log(`%cNOT FOUND ${evt.slug} : inserting...`, 'color: red')
      const cleanedEvt = schema.clean(evt)
      this.updateLog.insert.push(cleanedEvt)
      return { ref: cleanedEvt }
    }
  }

  matchUpdateFoundEvent(evt, found, schema) {
    this.foundIds.add(found._id)
    const cleanedFound = schema.clean(found)
    const cleanedEvt = schema.clean(evt)
    cleanedEvt.userId = this.userId
    if (_.isMatch(cleanedFound, cleanedEvt)) {
      // console.log('- %cMATCHES: nothing to update', 'color: teal')
    } else {
      // console.log('- %cDOES NOT MATCH: update', 'color: orange')
      if (evt.start !== found.start || evt.end !== found.end) {
        cleanedEvt._id = Events.getId(cleanedEvt)
        this.updateLog.insert.push(cleanedEvt)
        this.updateLog.remove.push(found)
        return { ref: cleanedEvt, _id: cleanedEvt._id }
      } else {
        cleanedEvt._id = found._id
        cleanedEvt._rev = found._rev
        this.updateLog.update.push(cleanedEvt)
      }
    }
    return { ref: cleanedEvt, _id: found._id, _rev: found._rev }
  }

  findSavedEvent(evt) {
    if (evt?.tag === 'vol') {
      return this.findSavedFlight(evt)
    }

    const slug = evt.slug || getSlug(evt, this.userId)

    if (this.savedEventsSlugMap.has(slug)) {
      const found = this.savedEventsSlugMap.get(slug)
      // console.log('%c> FOUND BY SLUG <', 'color: green', evt, found)
      return found
    } else {
      // console.log('%c>! NOT FOUND !<', 'color: red', evt, slug)
    }
  }

  findSavedFlight(vol) {
    const slug = vol.slug || getSlug(vol, this.userId)
    if (this.savedFlightsSlugMap.has(slug)) {
      const found = this.savedFlightsSlugMap.get(slug)
      // console.log('%c> Flight FOUND BY SLUG <', 'color: green', vol, found)
      return found
    } else {
      // console.log('%c>! Flight NOT FOUND !<', 'color: red', vol, slug)
    }
  }

  mapDateStringsToTimestamps(evt) {
    _.forEach(['start', 'end', 'std', 'sta'], field => {
      if (_.has(evt, field)) {
        const date = _.get(evt, field)
        _.set(evt, field, DateTime.fromISO(date).toMillis())
      }
    })
    if (_.isArray(evt.events)) {
      _.forEach(evt.events, sub => this.mapDateStringsToTimestamps(sub))
    }
    if (_.isArray(evt.sv)) {
      _.forEach(evt.sv, sv => this.mapDateStringsToTimestamps(sv))
    }
  }
}
