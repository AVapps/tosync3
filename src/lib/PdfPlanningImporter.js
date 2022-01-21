import { DateTime, Settings } from 'luxon'
import _ from 'lodash'
import { slug as getSlug } from './Utils.js'
import {
  rotationSchema,
  svSchema,
  solSchema,
  dutySchema
} from '@/model/index.js'

import { Events } from '@/model/Events.js'

Settings.defaultLocale = 'fr'
Settings.defaultZoneName = 'Europe/Paris'

const DT_TRANSLATION = {
  debut: 'start',
  fin: 'end'
}

function isRotation(evt) {
  return evt.tag === 'rotation'
}

/**
 * Importe un planning après s'être assuré que les évènements enregistrés
 * précédemments ont bien été migrés au nouveau format.
 **/
export class PdfPlanningImporter {
  constructor() {
    this.userId = null
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

  async importPlanning({ planning, params }) {
    console.log('PdfPlanningImporter.importPlanning', planning, params)
    this.userId = params.trigramme

    if (!this.userId) {
      throw new Error('ID utilisateur non défini !')
    }

    this.printedAt = params.printedAt
    this.initIndexes()

    const first = _.first(planning)
    const last = _.last(planning)

    this.savedEvents = await Events.getInterval(this.userId, first.debut.toMillis(), last.fin.toMillis())

    this.savedEventsByTag = _.groupBy(this.savedEvents, 'tag')
    console.log('PdfPlanningImport.importPlanning savedEvents', this.savedEvents, this.savedEventsByTag)

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
      this._exportDateTimes(evt)
      if (isRotation(evt)) {
        this.importRotation(evt)
      } else if (_.has(evt, 'events')) {
        this.importDutySol(evt)
      } else {
        this.importSol(evt)
      }
    })

    this.removeNotFounds()
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
    rot.slug = getSlug(rot, this.userId)
    if (rot.isIncomplete) {
      this.importIncompleteRotation(rot)
    } else {
      const found = this.findSavedEvent(rot)
      if (found) {
        console.log(`%cFOUND ${rot.slug}`, 'color:green')

        const firstEvent = _.first(_.first(rot.sv)?.events)
        if (firstEvent?.start > this.printedAt) { // Heures programmées => garder les heures enregistrées précédemment
          rot.start = found.start
          rot.end = found.end
        } else {
          const lastEvent = _.last(_.last(rot.sv)?.events)
          if (lastEvent?.end > this.printedAt) { // Heure de fin programmée => garder l'heure enregistrée
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
  }

  importIncompleteRotation(rot) {
    console.log(`importIncompleteRotation ${rot.slug}`, rot)
    if (!_.has(this.savedEventsByTag, 'rotation')) {
      this.insertRotation(rot)
      return
    }

    const firstSV = _.first(rot.sv)
    const foundRot = _.find(this.savedEventsByTag.rotation, savedRot => {
      if (savedRot.start <= rot.start) {
        let i = savedRot.sv.length - 1
        let match = false
        while (i >= 0) {
          const savedSV = savedRot.sv[i]
          if (match) {
            this.foundIds.add(savedSV._id)
            continue
          }
          if (DateTime.fromMillis(savedSV.start).hasSame(firstSV.start, 'day') &&
            _.first(savedSV.events).from === firstSV.from) {
            match = true
          }
          if (firstSV.start - savedSV.end > 8 * 60 * 60 * 1000 && // 8 hours
            _.last(savedSV.events).to === firstSV.from) {
            match = true
            this.foundIds.add(savedSV._id)
          }
          i--
        }
        return match
      }
    })

    if (foundRot) {
      console.log(`%cFOUND ${foundRot.slug} for`, 'color: green', rot)
      rot.start = foundRot.start
      rot.slug = getSlug(rot, this.userId)
      this.updateLog.remove.push(foundRot)

      if (foundRot.sv?.length && rot.sv?.length) {
        // TODO : add old SVS to new rot
        const firstNewSV = _.first(rot.sv)
        firstNewSV.slug = getSlug(firstNewSV, this.userId)
        let i = 0
        while (i < foundRot.sv.length) {
          const sv = foundRot.sv[i]
          if (sv.start > firstNewSV.start || sv.slug === firstNewSV.slug) {
            break
          }
          rot.sv.unshift(sv)
          i++
        }
      }

      this.insertRotation(rot)
    } else {
      this.insertRotation(rot)
    }
  }

  insertRotation(rot) {
    console.log(`%cNOT FOUND ${rot.slug} : inserting...`, 'color: red')

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
    this.completeSV(sv)
    const found = this.findSavedEvent(sv)
    if (found) {
      console.log(`%cFOUND SV ${sv.slug}`, 'color: green')

      const firstEvent = _.first(sv.events)
      if (firstEvent?.start > this.printedAt) { // Heures programmées => garder les heures enregistrées précédemment
        sv.start = found.start
        sv.end = found.end
      } else {
        const lastEvent = _.last(sv.events)
        if (lastEvent?.end > this.printedAt) { // Heure de fin programmée => garder l'heure enregistrée
          sv.end = found.end
        }
      }

      return this.matchUpdateFoundEvent(sv, found, svSchema)
    } else {
      console.log(`%c SV NOT FOUND ${sv.slug} : inserting...`, 'color: red')
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
          if (evt.isRealise) { // Utiliser les heures programmmées du vol enregistré
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

    sv.tag = sv.type
    sv.slug = getSlug(sv, this.userId)
    if (_.has(sv, 'peq.Pilot')) {
      _.set(sv, 'peq.pnt', _.get(sv, 'peq.Pilot'))
    }
    if (_.has(sv, 'peq.Cabin')) {
      _.set(sv, 'peq.pnc', _.get(sv, 'peq.Cabin'))
    }
    if (_.has(sv, 'peq.DHD')) {
      _.set(sv, 'peq.mep', _.get(sv, 'peq.DHD'))
    }
  }

  completeSol(sol) {
    sol.slug = getSlug(sol, this.userId)
    if (_.has(sol, 'peq.DHD')) {
      _.set(sol, 'peq.mep', _.get(sol, 'peq.DHD'))
    }
    if (_.has(sol, 'peq.GND')) {
      _.set(sol, 'peq.sol', _.get(sol, 'peq.GND'))
    }
  }

  removeNotFounds() {
    const notFounds = _.filter(this.savedEvents, evt => !this.foundIds.has(evt._id))
    this.updateLog.remove.push(...notFounds)
  }

  async save() {
    console.log(this.updateLog)
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
      console.log(`%cFOUND ${evt.slug}`, 'color: green')
      return this.matchUpdateFoundEvent(evt, found, schema)
    } else {
      console.log(`%cNOT FOUND ${evt.slug} : inserting...`, 'color: red')
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
      console.log('- %cMATCHES: nothing to update', 'color: teal')
    } else {
      console.log('- %cDOES NOT MATCH: update', 'color: orange')
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
    console.log('SLUG for', slug, evt)

    if (this.savedEventsSlugMap.has(slug)) {
      const found = this.savedEventsSlugMap.get(slug)
      console.log('%c> FOUND BY SLUG <', 'color: green', evt, found)
      return found
    } else {
      console.log('%c>! NOT FOUND !<', 'color: red', evt, slug)
    }
  }

  findSavedFlight(vol) {
    const slug = vol.slug || getSlug(vol, this.userId)
    if (this.savedFlightsSlugMap.has(slug)) {
      const found = this.savedFlightsSlugMap.get(slug)
      console.log('%c> Flight FOUND BY SLUG <', 'color: green', vol, found)
      return found
    } else {
      console.log('%c>! Flight NOT FOUND !<', 'color: red', vol, slug)
    }
  }

  _exportDateTimes(evt) {
    _.forEach(['debut', 'fin'], field => {
      if (_.has(evt, field)) {
        const dt = _.get(evt, field)
        if (dt.isLuxonDateTime) {
          _.set(evt, DT_TRANSLATION[field], dt.toMillis())
          if (evt.realise) {
            _.set(evt, ['real', DT_TRANSLATION[field]], dt.toMillis())
          }
        }
      }
    })
    if (_.isArray(evt.events)) {
      _.forEach(evt.events, sub => this._exportDateTimes(sub))
    }
    if (_.isArray(evt.sv)) {
      _.forEach(evt.sv, sv => this._exportDateTimes(sv))
    }
  }
}

// eslint-disable-next-line no-unused-vars
function printEvent(evt) {
  if (isRotation(evt)) {
    console.log(`%c[ROTATION] ${evt.debut.toLocaleString(DateTime.DATETIME_FULL)}`, 'color: blue')
    _.forEach(evt.sv, sv => {
      if (_.has(sv, 'fromHotel')) console.log(`{...HOTEL} ${sv.fromHotel.summary}`)
      console.log(`%c[${sv.type}] ${sv.summary} - ${sv.debut.toLocaleString(DateTime.DATETIME_FULL)}`, 'color: teal')
      _.forEach(sv.events, etape => console.log(`-> ${etape.summary} - ${etape.debut.toLocaleString(DateTime.DATETIME_FULL)}`))
      if (_.has(sv, 'hotel')) console.log(`{HOTEL} ${sv.hotel.summary}`)
    })
  } else {
    console.log(`%c[${evt.tag}] %c(${evt.summary}) ${evt.debut.toLocaleString(DateTime.DATETIME_FULL)}`, 'color: brown', 'color: inherit')
    if (evt.events && evt.events.length) {
      _.forEach(evt.events, subEvt => console.log(`-> ${subEvt.tag} - ${subEvt.summary} - ${subEvt.debut.toLocaleString(DateTime.DATETIME_FULL)}`))
    }
  }
}
