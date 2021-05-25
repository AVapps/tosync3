import { DateTime, Settings } from 'luxon'
import _ from 'lodash'
import { slug } from './Utils.js'
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

/**
 * Importe un planning après s'être assuré que les évènements enregistrés
 * précédemments ont bien été migrés au nouveau format.
 **/
export class PdfPlanningImporter {
  constructor(pdfPlanning) {
    this.parser = pdfPlanning
    this.userId = this.parser.meta.trigramme
    this.savedEvents = []
    this.savedEventsByTag = {}
    this.initIndexes()
  }

  initIndexes() {
    this.updateLog = {
      userId: this.userId,
      insert: [],
      rotationInsert: [],
      update: {}, // { _id -> modifier }
      remove: []
    }
    this.foundIds = new Set()
    this.savedEventsSlugMap = new Map()
    this.savedFlightsSlugMap = new Map()
  }

  async importPlanning() {
    const first = _.first(this.parser.planning)
    const last = _.last(this.parser.planning)

    try {
      this.savedEvents = await Events.getInterval(this.userId, first.debut.toMillis(), last.fin.toMillis())
    } catch (error) {
      console.error(error)
      return
    }

    this.savedEventsByTag = _.groupBy(this.savedEvents, 'tag')
    console.log('PdfPlanningImport.importPlanning savedEvents', this.savedEvents, this.savedEventsByTag)

    this.initIndexes()

    // Générer les index Maps
    _.forEach(this.savedEvents, evt => {
      this.savedEventsSlugMap.set(evt.slug, evt)
      if (evt.rotationId) {
        if (evt.events && evt.events.length) {
          _.forEach(evt.events, sub => {
            sub.slug = slug(sub, this.userId)
            this.savedFlightsSlugMap.set(sub.slug, sub)
          })
        } else {
          console.log(`!!! SV sans events !!!`, evt)
        }
      }
    })

    if (this.savedEventsByTag.rotation && this.savedEventsByTag.rotation.length) {
      // Grouper les SV & rotations
      _.chain(this.savedEvents)
        .filter(evt => _.has(evt, 'rotationId'))
        .groupBy('rotationId')
        .forEach((svs, rotationId) => {
          const rotation = _.find(this.savedEventsByTag.rotation, { _id: rotationId })
          if (rotation) {
            rotation.sv = svs
          } else {
            console.log(`Erreur de planning : rotation introuvable !`, svs, rotationId)
          }
        })
        .value()
    }

    _.forEach(this.parser.planning, evt => {
      this._exportDateTimes(evt)
      if (evt.tag === 'rotation') {
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
    rot.slug = slug(rot, this.userId)
    if (rot.isIncomplete) {
      this.importIncompleteRotation(rot)
    } else {
      const found = this.findSavedEvent(rot)
      if (found) {
        console.log(`FOUND ${rot.slug}`)
        this.matchUpdateFoundEvent(rot, found, rotationSchema)
        _.forEach(rot.sv, sv => {
          sv.rotationId = found._id
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
          if (DateTime.fromMillis(savedSV.start).hasSame(firstSV.start, 'day')
            && _.first(savedSV.events).from === firstSV.from) {
            match = true
          }
          if (firstSV.start - savedSV.end > 8 * 60 * 60 * 1000 // 8 hours
            && _.last(savedSV.events).to === firstSV.from) {
            match = true
            this.foundIds.add(savedSV._id)
          }
          i--;
        }
        return match
      }
    })

    if (foundRot) {
      console.log(`FOUND ${foundRot.slug} for`, rot)
      rot.start = foundRot.start
      rot.slug = slug(rot, this.userId)
      this.updateLog.remove.push(foundRot)
      // add old SVS to new rot

      this.insertRotation(rot)
    } else {
      this.insertRotation(rot)
    }
  }

  insertRotation(rot) {
    console.log(`NOT FOUND ${rot.slug} : inserting...`)
    this.updateLog.rotationInsert.push({
      rotation: _.omit(rotationSchema.clean(rot), '_id', '_rev'),
      sv: _.map(rot.sv, sv => this.importSV(sv))
    })
  }

  importSV(sv) {
    this.completeSV(sv)
    return this.matchOrReplaceImport(sv, svSchema)
  }

  completeSV(sv) {
    _.forEach(sv.events, evt => {
      if (evt.tag === 'vol') {
        evt.slug = slug(evt, this.userId)
        const savedVol = this.findSavedFlight(evt)
        if (savedVol) {
          if (evt.isRealise) { // Utiliser les heures programmmées du vol enregistré
            _.set(evt, 'real', {
              start: evt.start,
              end: evt.end
            })
            evt.start = savedVol.start
            evt.end = savedVol.end
          } else if (_.has(savedVol, 'real')) { // Utiliser les heures réalisées du vol enregistré
            _.set(evt, 'real', savedVol.real)
          }
        }
      }
    })
    sv.tag = sv.type
    sv.slug = slug(sv, this.userId)
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
    sol.slug = slug(sol, this.userId)
    if (_.has(sol, 'peq.DHD')) {
      _.set(sol, 'peq.mep', _.get(sol, 'peq.DHD'))
    }
    if (_.has(sol, 'peq.GND')) {
      _.set(sol, 'peq.sol', _.get(sol, 'peq.GND'))
    }
  }

  removeNotFounds() {
    const notFounds = _.difference(this.savedEvents.map(evt => evt._id), [...this.foundIds])
    this.updateLog.remove.push(...notFounds)
  }

  async save() {
    if (this.updateLog.rotationInsert
      || this.updateLog.insert.length
      || this.updateLog.update.length
      || this.updateLog.remove.length) {
      let result
      try {
        result = {
          updateLog: this.updateLog,
          result: await Events.processBulkUpdate(this.updateLog)
        }
      } catch (error) {
        console.error(error)
        return
      }
      this.initIndexes()
      return result
    }
  }

  matchOrReplaceImport(evt, schema) {
    printEvent(evt)
    const found = this.findSavedEvent(evt)
    if (found) {
      console.log(`FOUND ${evt.slug}`)
      return this.matchUpdateFoundEvent(evt, found, schema)
    } else {
      console.log(`NOT FOUND ${evt.slug} : inserting...`)
      const cleanedEvt = schema.clean(evt)
      this.updateLog.insert.push(cleanedEvt)
      return { ref: cleanedEvt }
    }
  }

  matchUpdateFoundEvent(evt, found, schema) {
    this.foundIds.add(found._id)
    printEvent(evt)
    const cleanedFound = _.omit(schema.clean(found), '_id', '_rev', 'userId')
    const cleanedEvt = schema.clean(evt)
    if (_.isMatch(cleanedFound, cleanedEvt)) {
      console.log('- MATCHES: nothing to update')
    } else {
      console.log('- DOES NOT MATCH: update')
      if (evt.start !== found.start || evt.end !== found.end) {
        this.updateLog.insert.push(cleanedEvt)
        this.updateLog.remove.push(found)
      } else {
        cleanedEvt._id = found._id
        cleanedEvt._rev = found._rev
        _.set(this.updateLog.update, [found._id, '$set'], cleanedEvt)
      }
    }
    return { ref: cleanedEvt, _id: found._id, _rev: found._rev }
  }

  findSavedEvent(evt) {
    if (!_.has(this.savedEventsByTag, evt.tag)) return undefined

    if (evt.tag === 'vol') {
      return this.findSavedFlight(evt)
    }

    const slug = evt.slug || slug(evt, this.userId)
    console.log('SLUG for', slug, evt)

    if (this.savedEventsSlugMap.has(slug)) {
      const found = this.savedEventsSlugMap.get(slug)
      console.log('> FOUND BY SLUG <', evt, found)
      return found
    } else {
      console.log('>! NOT FOUND !<', evt, slug)
    }
  }

  findSavedFlight(vol) {
    const slug = vol.slug || slug(vol, this.userId)
    if (this.savedFlightsSlugMap.has(slug)) {
      const found = this.savedFlightsSlugMap.get(slug)
      console.log('> Flight FOUND BY SLUG <', vol, found)
      return found
    } else {
      console.log('>! Flight NOT FOUND !<', vol, slug)
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

function printEvent(evt) {
  if (evt.tag === 'rotation') {
    console.log(`[ROTATION] ${evt.debut.toLocaleString(DateTime.DATETIME_FULL)}`)
    _.forEach(evt.sv, sv => {
      if (_.has(sv, 'fromHotel')) console.log(`{...HOTEL} ${sv.fromHotel.summary}`)
      console.log(`[${sv.type}] ${sv.summary} - ${sv.debut.toLocaleString(DateTime.DATETIME_FULL)}`)
      _.forEach(sv.events, etape => console.log(`-> ${etape.summary} - ${etape.debut.toLocaleString(DateTime.DATETIME_FULL)}`))
      if (_.has(sv, 'hotel')) console.log(`{HOTEL} ${sv.hotel.summary}`)
    })
  } else {
    console.log(`[${evt.tag}] (${evt.summary}) ${evt.debut.toLocaleString(DateTime.DATETIME_FULL)}`)
    if (evt.events && evt.events.length) {
      _.forEach(evt.events, subEvt => console.log(`-> ${subEvt.tag} - ${subEvt.summary} - ${subEvt.debut.toLocaleString(DateTime.DATETIME_FULL)}`))
    }
  }
}