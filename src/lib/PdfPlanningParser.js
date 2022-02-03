import { DateTime, Duration, Settings } from 'luxon'
import _ from 'lodash'
import { findTag, findCodeInstruction, ALLDAY_TAGS } from './Utils.js'

Settings.defaultLocale = 'fr'
Settings.defaultZoneName = 'Europe/Paris'

const BASES = ['ORY', 'CDG', 'LYS', 'MPL', 'NTE']
const FLIGHT_REG = /([A-Z]{3})-([A-Z]{3})(?:\s\(([A-Z]+)\))?/
const MEP_REG = /([A-Z]{3})-([A-Z]{3})/
const DATE_REG = /^\s?[A-z]{3}\.\s(\d\d)\/(\d\d)\/(\d\d\d\d)/
const TIME_REG = /^\d\d:\d\d$/
const CREW_TITLE_REG = /\w+:/
const CREW_LIST_REG = /^(\s+©?[A-Z]{3})+$/
const CREW_LINE_REG = /^((\s©?\w+)+)\s+\(([A-Z]{3})\)$/

const hasNewline = (str) => str?.includes('\n')

const BEGIN_DUTY_REG = /Begin Duty/
function isBeginDuty({ header }) {
  return BEGIN_DUTY_REG.test(header)
}

const END_DUTY_REG = /End Duty/
function isEndDuty({ header }) {
  return END_DUTY_REG.test(header)
}

const DUTY_FLIGHT_REG = /Duty Flight/
function isDutyFlight({ header }) {
  return DUTY_FLIGHT_REG.test(header)
}

const DHD_REG = /DHD|Train|Transfert|Shuttle/
function isMEP({ header }) {
  return DHD_REG.test(header)
}

const END_REST_REG = /End Rest/
function isEndRest({ header }) {
  return END_REST_REG.test(header)
}

const GROUND_ACT_REG = /Ground Act./
function isGroundAct({ header }) {
  return GROUND_ACT_REG.test(header)
}

const HOTEL_REG = /HOTAC/
function isHotel({ header }) {
  return HOTEL_REG.test(header)
}

export class PdfPlanningParser {
  constructor(options) {
    this.options = _.defaults(options, {
      bases: BASES
    })
    this.events = []
    this.rotations = []
    this.sols = []
    this.planning = []
  }

  /***
   * (1) Parser les activités / repos / services
   * (2) Grouper les services de vol en rotation en déterminant la base d'arrivée au premier repos
   */
  parse(pdf) {
    this.meta = pdf.meta
    this.printedAt = DateTime.fromFormat(this.meta.printedOn, 'dd/MM/yyyy HH:mm', { zone: 'Europe/Paris' })
    this.parseDuties(pdf.table)
    this.groupRotations()
    this.factorSolDays()
    this.buildPlanning()
    this.printPlanning()
  }

  parseDuties(lines) {
    this._precDuty = null
    this._duty = null
    this._hotel = null
    this._date = null
    this._ground = null

    const rows = this.mapAndCorrectRows(lines)
    console.log('- corrected rows', rows)

    let i = 0
    while (i < rows.length) {
      const evt = rows[i]

      if (evt.type === 'date') {
        const m = evt.content.match(DATE_REG)
        this._date = DateTime.utc(parseInt(m[3]), parseInt(m[2]), parseInt(m[1]))
        if (/BLANC$/.test(evt.content)) {
          this.addBlanc()
        }
        i++
        continue
      }

      if (evt.header) {
        evt.activity = evt.activity.replace(/\s/g, '')
        evt.summary = evt.summary.replace(/\s+/g, ' ')

        if (evt.peq && evt.peq.length) {
          evt.peq = this._parsePeq(evt.peq)
        }

        if (evt.instruction) {
          const tasks = this._parseInstruction(evt.instruction)
          if (tasks && tasks.length) {
            const userTasks = _.remove(tasks, task => !_.isEmpty(task.fonction))
            evt.instruction = {}
            if (userTasks.length) evt.instruction.own = userTasks
            if (tasks && tasks.length) evt.instruction.other = tasks
          } else {
            console.log('! Impossible de parser le champ instruction:', evt.instruction, evt)
          }
        }

        if (isBeginDuty(evt)) {
          this.beginDuty(evt)
        } else if (isEndDuty(evt)) {
          this.endDuty(evt)
        } else if (isDutyFlight(evt)) {
          this.addFlight(evt)
        } else if (isMEP(evt)) {
          this.addMEP(evt)
        } else if (isGroundAct(evt)) {
          this.addGround(evt)
        } else if (isHotel(evt)) {
          this.addHotel(evt)
        } else if (isEndRest(evt)) {
          this.endRest(evt)
        } else {
          console.log(`Type Inconnu : ${evt.header}`)
        }
      }
      i++
    }

    if (this._duty) {
      this.endDuty()
    }
  }

  mapAndCorrectRows(lines) {
    const rows = _.map(lines, (line, index) => {
      if (line.length === 1 && DATE_REG.test(line[0])) { // Ligne de Date
        return {
          type: 'date',
          index,
          content: line[0]
        }
      } else {
        return {
          type: 'event',
          index,
          header: line[0],
          start: line[1],
          end: line[2],
          activity: line[3],
          fonction: line[4],
          summary: line[5],
          typeAvion: line[6],
          tv: line[7],
          instruction: line[8],
          peq: line[9],
          remark: line[10]
        }
      }
    })

    // Correct rows
    let headerOffset = false
    let activityOffset = false
    let summaryOffset = false
    let followsDate = false
    let i = 1 // Commencer à la deuxième car la première est toujours bien alignée
    while (i < rows.length) {
      const row = rows[i]

      if (row.type === 'date') {
        if (row.activity || row.summary || row.header) {
          console.log(row)
        }
        followsDate = true
        i++
        continue
      }

      if (followsDate) { // La première ligne suivant une ligne de date est bien alignée
        headerOffset = false
        activityOffset = false
        summaryOffset = false
        followsDate = false
        i++
        continue
      }

      if (row.start?.length) { // Seules les lignes ayant une heure de début sont traitées
        headerOffset = headerOffset || this.hasHeaderOffset(row, i, rows)
        if (headerOffset) {
          console.log('! DECALAGE de ligne d\'entète', row, row.header)
          let prevHeader
          if (hasNewline(row.header)) {
            console.log('HEADER has newline', row.header)
            const [pre, ...rest] = row.header.split('\n')
            prevHeader = pre
            row.header = rest.join('\n')
            console.log('NEW header', row.header)
          } else {
            console.log('PLAIN header', row.header)
            prevHeader = row.header
            row.header = ''
          }
          // recopier l'entète dans la ligne précédente
          rows[i - 1].header += prevHeader
          console.log('PREV header', rows[i - 1].header)
        }

        activityOffset = activityOffset || this.hasActivityOffset(row, i, rows)
        if (activityOffset) {
          console.log('! DECALAGE de ligne de code/numéro', row, row.activity)
          let prevActivity
          if (hasNewline(row.activity)) {
            console.log('ACTIVITY has newline', row.activity)
            const [pre, ...rest] = row.activity.split('\n')
            prevActivity = pre
            row.activity = rest.join('\n')
            console.log('NEW activity', row.activity)
          } else {
            console.log('PLAIN activity', row.activity)
            prevActivity = row.activity
            row.activity = ''
          }
          // recopier le code activité dans la ligne précédente
          rows[i - 1].activity += prevActivity
          console.log('PREV activity', rows[i - 1].activity)
        }

        summaryOffset = summaryOffset || this.hasSummaryOffset(row, i, rows)
        if (summaryOffset) {
          console.log('! DECALAGE de ligne de description', row, row.summary)
          let prevSummary
          if (hasNewline(row.summary)) {
            console.log('SUMMARY has newline', row.summary)
            const [pre, ...rest] = row.summary.split('\n')
            prevSummary = pre
            row.summary = rest.join('\n')
            console.log('NEW summary', row.summary)
          } else {
            console.log('PLAIN summary', row.summary)
            prevSummary = row.summary
            row.summary = ''
          }
          // recopier le titre dans la ligne précédente
          const prev = rows[ i - 1 ]
          console.log(row, prev, prev.summary)
          if (prev.summary.length) {
            prev.summary += ' ' + prevSummary
          } else {
            prev.summary = prevSummary
          }
          console.log('PREV SUMMARY', prev.summary)
        }

        // Correction supplémentaire en cas de double décalage
        const isLastOfRow = i === rows.length - 1 || rows[i + 1].type === 'date'
        if (isEndDuty(row) || isEndRest(row) || isBeginDuty(row)) {
          if (isLastOfRow && !_.isEmpty(row.activity)) {
            rows[i - 1].activity += row.activity
            row.activity = ''
          }
        }
      }
      i++
    }
    return rows
  }

  hasHeaderOffset(row, i, rows) {
    const prev = rows[i - 1]
    if (hasNewline(prev.header)) return true
    return row.header === 'Flt' && prev.header.includes('DHD Compagny')
  }

  hasActivityOffset(row, i, rows) {
    const prev = rows[i - 1]
    if (hasNewline(prev.activity)) {
      // console.log('hasActivityOffset: saut de ligne sur ligne précédente', prev.activity, prev)
      return true
    }

    // Code activité a 1 seul chr + code activité précédent occupe toute la largeur de colonne (9 chr)
    if (row.activity.length === 1 && prev.activity.length >= 9) {
      return true
    }

    if (isDutyFlight(row) || isMEP(row) || isGroundAct(row)) {
      return _.isEmpty(row.activity)
    } else {
      return !_.isEmpty(row.activity)
    }
  }

  hasSummaryOffset(row, i, rows) {
    const prev = rows[i - 1]
    if (_.includes(['Ground Act.', 'HOTAC'], prev.header) && hasNewline(prev.summary)) {
      return true
    }

    let summary, nextSummary
    if (hasNewline(row.summary)) {
      const [pre, ...rest] = row.summary.split('\n')
      summary = pre
      nextSummary = rest.join('\n')
    } else {
      summary = row.summary
      nextSummary = i < (rows.length - 1) ? rows[i + 1].summary : null
    }

    if (isBeginDuty(row) && !/duty$/i.test(summary) && /duty/i.test(nextSummary)) {
      return true
    }
    if (isDutyFlight(row) && !FLIGHT_REG.test(summary) && FLIGHT_REG.test(nextSummary)) {
      return true
    }
    if (isMEP(row) && !MEP_REG.test(summary) && MEP_REG.test(nextSummary)) {
      return true
    }
    if ((isEndDuty(row) || isEndRest(row)) && summary.length && i > 0 && !nextSummary) {
      return true
    }

    // Cas jour OFF compagnie OFFG
    if (prev.activity === 'OFFG' && /^compag/.test(summary)) {
      return true
    }

    return false
  }

  beginDuty(event) {
    console.log('[beginDuty]', event.summary, this._date.toLocaleString(), event.start.toString())

    if (this._duty) {
      // console.log(this._duty, event)
      throw new Error('Une duty existe déjà !')
    }

    this._duty = {
      summary: event.summary,
      debut: this._date.set(this._parseTime(event.start)).setZone('Europe/Paris'),
      events: []
    }

    if (this._hotel) { // un évènement HOTEL est en suspens (pas de OFF ou de SV avant la nouvelle duty)
      this._duty.fromHotel = this._hotel
      this._hotel = null
    }
  }

  addFlight(event) {
    const m = event.summary.match(FLIGHT_REG)
    if (!m || m.length !== 4) {
      console.log(event)
      throw new Error('flight-error', 'Format de titre de vol inconnu !')
    }

    const vol = {
      tag: 'vol',
      fonction: event.fonction,
      summary: `${event.activity} (${m[1]}-${m[2]}) ${event.typeAvion}`,
      num: event.activity,
      from: m[1],
      to: m[2],
      immat: m[3],
      debut: this._date.set(this._parseTime(event.start)).setZone('Europe/Paris'),
      fin: this._date.set(this._parseTime(event.end)).setZone('Europe/Paris'),
      type: event.typeAvion,
      tv: this._parseDuration(event.tv)
    }

    if (event.remark) vol.remark = event.remark
    if (event.peq) vol.peq = event.peq
    if (event.instruction) vol.instruction = event.instruction

    if (!this._duty) {
      this.beginDuty(event)
    }

    this._duty.type = 'sv' // Tout service comprenant un vol est un SV

    if (!this._duty.from) {
      this._duty.from = vol.from
    }

    console.log('[addFlight]', event.summary, this._date.toLocaleString())

    if (vol.fin < vol.debut) {
      console.log('!!! Heure de fin du vol inférieure à heure de début de vol : ', vol.debut.toString(), vol.fin.toString())
      vol.fin = vol.debut.plus({ hours: vol.tv })
      console.log(vol.fin.toString())
    }

    vol.isRealise = vol.fin < this.printedAt

    this._duty.events.push(vol)
  }

  addMEP(event) {
    console.log('[addMEP]', event.summary, this._date.toLocaleString())
    const m = event.summary.match(MEP_REG)
    if (!m || m.length !== 3) throw new Error('mep-error', 'Format de titre de MEP inconnu !')

    const mep = {
      tag: 'mep',
      fonction: event.fonction,
      summary: `MEP ${event.activity} (${m[1]}-${m[2]}) ${event.typeAvion}`,
      num: event.activity || event.header,
      title: event.activity || event.header,
      from: m[1],
      to: m[2],
      debut: this._date.set(this._parseTime(event.start)).setZone('Europe/Paris'),
      fin: this._date.set(this._parseTime(event.end)).setZone('Europe/Paris'),
      type: event.typeAvion
    }

    if (event.remark) mep.remark = event.remark
    if (event.peq) mep.peq = event.peq
    if (event.instruction) mep.instruction = event.instruction

    if (!this._duty) {
      this.beginDuty(event)
    }

    if (!this._duty.from) {
      this._duty.from = mep.from
    }

    if (!this._duty.type) {
      this._duty.type = 'mep'
    }

    if (mep.fin < mep.debut) {
      console.log('Heure de fin du vol inférieure à heure de début de vol : ', mep.debut.toString(), mep.fin.toString())
      mep.fin = this._date.plus({ days: 1 }).set(this._parseTime(event.end)).setZone('Europe/Paris')
      console.log(mep.fin.toLocaleString())
    }

    mep.mep = mep.fin.diff(mep.debut).as('hours')

    this._duty.events.push(mep)
  }

  endDuty(event) {
    if (_.isEmpty(this._duty.events)) {
      this._duty = null
      return
    }

    if (_.isUndefined(event)) {
      event = _.last(this._duty.events)
    }

    console.log('[endDuty]', event.summary, this._date.toLocaleString())
    this._duty.fin = this._date.set(this._parseTime(event.end)).setZone('Europe/Paris')

    if (this._duty.fin < this._duty.debut) {
      console.log('Heure de fin du vol inférieure à heure de début de vol : ', this._duty.debut.toString(), this._duty.fin.toString())
      throw new Error('Heure de fin du vol inférieure à heure de début de vol')
    }

    if (!_.has(this._duty, 'type')) {
      console.log(this._date.toLocaleString(), event.summary)
      throw new Error('Type de duty non défini !')
    }

    if (this._duty.type === 'sv' || this._duty.type === 'mep') {
      this._duty.ts = this._duty.fin.diff(this._duty.debut).as('hours')

      if (this._duty.ts > 16.5 || this._duty.ts < 0) {
        console.log('TS incohérent : ', this._duty)
        throw new Error(`Temps de service incohérent : ${this._duty.ts}`)
      }

      const groups = _.groupBy(this._duty.events, 'tag')
      const etapes = _.filter(this._duty.events, evt => evt.tag === 'vol' || evt.tag === 'mep')
      this._duty.countVol = groups.vol ? groups.vol.length : 0
      this._duty.countMEP = groups.mep ? groups.mep.length : 0
      this._duty.mep = groups.mep ? _.sumBy(groups.mep, 'mep') : 0
      this._duty.to = _.last(etapes).to

      this.events.push(this._duty)
    }

    if (this._duty.type === 'sol') {
      const firstSol = _.find(this._duty.events, { type: 'sol' })
      const specialCategoryEvent = _.find(this._duty.events, evt => {
        return _.includes(['simu', 'instructionSol', 'instructionSimu', 'stage', 'delegation', 'reserve'], evt.tag)
      })
      this._duty.tag = specialCategoryEvent ? specialCategoryEvent.tag : firstSol.tag
      this.events.push(this._duty)
      this.sols.push(this._duty)
    }

    const hasPeq = _.find(this._duty.events, evt => _.isObject(evt.peq))
    if (hasPeq) this._duty.peq = hasPeq.peq
    const hasInst = _.find(this._duty.events, evt => _.isObject(evt.instruction))
    if (hasInst) this._duty.instruction = hasInst.instruction

    this._precDuty = this._duty
    this._duty = null
  }

  endRest(event) {
    console.log('[endRest]', event.summary)
    // Réservé
  }

  addBlanc() {
    console.log('[addBlanc]', 'BLANC', this._date.toLocaleString())
    const evt = {
      type: 'sol',
      category: 'BLANC',
      tag: 'blanc',
      summary: 'Blanc',
      debut: this._date.setZone('Europe/Paris').startOf('day'),
      fin: this._date.setZone('Europe/Paris').endOf('day')
    }
    this.events.push(evt)
    this.sols.push(evt)
  }

  addGround(event) {
    let sol = {
      type: 'sol',
      category: event.activity,
      tag: this._findTag(event.activity),
      summary: event.summary,
      debut: (event.start && TIME_REG.test(event.start)) ? this._date.set(this._parseTime(event.start)).setZone('Europe/Paris') : undefined,
      fin: (event.end && TIME_REG.test(event.end)) ? this._date.set(this._parseTime(event.end)).setZone('Europe/Paris') : undefined,
      fonction: event.fonction
    }

    if (event.remark) sol.remark = event.remark
    if (event.peq) sol.peq = event.peq
    if (event.instruction) sol.instruction = event.instruction

    console.log('[addGround]', event.summary)

    if (_.isUndefined(sol.fin)) {
      // console.log('[beginGround]', event.summary, this._date.toLocaleString(), event.start)
      this._ground = sol
      return
    }

    if (_.isUndefined(sol.debut) && sol.fin && sol.fin.isValid) {
      // console.log('[endGround]', sol.fin.toLocaleString())
      if (!this._ground) {
        sol.debut = sol.fin.startOf('day')
      } else {
        this._ground.fin = sol.fin
        sol = this._ground
        this._ground = null
      }
    }

    if (this._duty) {
      if (!this._duty.type || this._duty.type === 'mep') {
        this._duty.type = 'sol'
      }
      this._duty.events.push(sol)
    } else {
      this._hotel = null
      this._precDuty = null
      // sol.duree = sol.fin.diff(sol.debut).as('hours')
      this.events.push(sol)
      this.sols.push(sol)
    }
  }

  addHotel(event) {
    if (event.start && TIME_REG.test(event.start)) {
      console.log('[beginHotel]', event.summary)
      this._hotel = {
        tag: 'hotel',
        summary: event.summary,
        debut: this._date.set(this._parseTime(event.start)).setZone('Europe/Paris')
      }

      if (event.remark) this._hotel.remark = event.remark

      if (this._precDuty) {
        this._hotel.location = this._precDuty.to
      }
    }

    if (this._hotel && event.end && TIME_REG.test(event.end)) {
      console.log('[endHotel]', event.summary)
      this._hotel.fin = this._date.set(this._parseTime(event.end)).setZone('Europe/Paris')
      // this._hotel.duree = this._hotel.fin.diff(this._hotel.debut).as('hours')
      if (this._precDuty) {
        this._precDuty.hotel = this._hotel
        this._hotel = null
      }
    }
  }

  groupRotations() {
    this.events = _.sortBy(this.events, ['debut', 'fin'])

    // Chercher un jour de repos ou congé comme point de départ de l'algorythme de recherche de rotations
    const startIndex = _.findIndex(this.events, evt => ['repos', 'conges'].includes(evt.tag))
    // console.log(this.events, startIndex)

    let rotations
    // Applique la recherche de rotation à gauche et à droite du jour de repos ou congé trouvé
    if (startIndex !== -1) {
      rotations = [
        ...this._getRotationsFromRight(_.slice(this.events, 0, startIndex)),
        ...this._getRotationsFromLeft(_.slice(this.events, startIndex))
      ]
    // Sinon applique la recherche de rotation à partir de la fin car les rotations ne sont pas découpées en fin de planning
    } else {
      rotations = this._getRotationsFromRight(this.events)
    }

    this.rotations = rotations
  }

  _getRotationsFromLeft(events) {
    const rotations = []
    let rotation = null
    let prevDuty = null

    _.forEach(events, evt => {
      // console.log(evt, evt.type, evt.tag, _.map(evt.events, evt => [ evt.num, evt.from, evt.to, evt.debut.toLocaleString(DateTime.DATETIME_SHORT) ]))
      if (evt.type === 'sv' || evt.type === 'mep') {
        if (!rotation) { // Cas d'un premier SV de MEP isolée ! et si SV de MEP isolée pour activités sol ?
          rotation = this.beginRotation(evt.from)
        } else if (this._shouldCompleteRotation(rotation, prevDuty, evt)) {
          rotations.push(this.endRotation(rotation))
          rotation = this.beginRotation(evt.from)
        }
        rotation.sv.push(evt)
        prevDuty = evt
      } else if (rotation) {
        rotations.push(this.endRotation(rotation))
        rotation = null
        prevDuty = null
      }
    })

    if (rotation) {
      rotations.push(this.endRotation(rotation))
    }

    return rotations
  }

  _getRotationsFromRight(events) {
    const rotations = []
    let rotation = null
    let nextDuty = null

    _.forEachRight(events, evt => {
      if (evt.type === 'sv' || evt.type === 'mep') {
        if (!rotation) {
          rotation = this.beginRotation(evt.to)
        } else if (this._shouldCompleteRotationRight(rotation, evt, nextDuty)) {
          rotations.push(this.endRotation(rotation))
          rotation = this.beginRotation(evt.to)
        }
        rotation.sv.unshift(evt)
        nextDuty = evt
      } else if (rotation) {
        rotations.push(this.endRotation(rotation))
        rotation = null
        nextDuty = null
      }
    })

    if (rotation) {
      rotations.push(this.endRotation(rotation))
    }

    return rotations.reverse()
  }

  _shouldCompleteRotation(rotation, prevDuty, evt) {
    if (!prevDuty || prevDuty.hotel) return false

    if (rotation.base) {
      return prevDuty.to === rotation.base ||
        (prevDuty.to === 'CDG' && rotation.base === 'ORY')
    } else {
      return _.includes(this.options.bases, evt.from)
    }
  }

  _shouldCompleteRotationRight(rotation, evt, nextDuty) {
    if (!nextDuty || evt.hotel) return false

    if (rotation.base) {
      return nextDuty.from === rotation.base ||
        (nextDuty.from === 'CDG' && rotation.base === 'ORY')
    } else {
      return _.includes(this.options.bases, nextDuty.from)
    }
  }

  beginRotation(base) {
    console.log('[beginRotation]')
    if (base === 'CDG') base = 'ORY'
    return {
      type: 'rotation',
      tag: 'rotation',
      sv: [],
      base: _.includes(this.options.bases, base) ? base : undefined
    }
  }

  endRotation(rotation) {
    console.log('[endRotation]', rotation)
    const firstSV = _.first(rotation.sv)
    const lastSV = _.last(rotation.sv)

    rotation.debut = firstSV.debut
    rotation.fin = lastSV.fin

    if (firstSV.fromHotel) {
      rotation.isIncomplete = true
    }

    if (_.isUndefined(rotation.base)) {
      if (_.includes(this.options.bases, firstSV.from)) {
        rotation.base = firstSV.from
      } else if (_.includes(this.options.bases, lastSV.to)) {
        rotation.base = lastSV.to
      }
      if (rotation.base === 'CDG') {
        rotation.base = 'ORY'
      }
    }

    rotation.nbjours = rotation.fin.startOf('day').diff(rotation.debut.startOf('day')).as('days') + 1

    rotation.tv = _.sumBy(rotation.sv, 'tv')
    rotation.countVol = _.sumBy(rotation.sv, 'countVol')
    rotation.mep = _.sumBy(rotation.sv, 'mep')
    rotation.countMEP = _.sumBy(rotation.sv, 'countMEP')

    if (rotation.sv.length > 1) {
      rotation.decouchers = _.reduce(rotation.sv, (list, sv, index, svs) => {
        if (sv.hotel) {
          if (index === 0 || (svs[index - 1].hotel && svs[index - 1].hotel.location !== sv.hotel.location)) {
            list.push(sv.hotel.location)
          }
        }
        return list
      }, [])
    }

    return rotation
  }

  factorSolDays() {
    const result = []
    let memo = null
    _.forEach(this.sols, sol => {
      if (_.includes(ALLDAY_TAGS, sol.tag)) {
        if (memo) {
          if (memo.activity === sol.activity &&
            memo.summary === sol.summary &&
            memo.fin.plus({ days: 1 }).hasSame(sol.debut, 'day')) {
            memo.fin = sol.fin
          } else {
            memo.debut = memo.debut.startOf('day')
            memo.fin = memo.fin.endOf('day')
            result.push(memo)
            memo = sol
          }
        } else {
          memo = sol
        }
      } else {
        if (memo) {
          memo.debut = memo.debut.startOf('day')
          memo.fin = memo.fin.endOf('day')
          result.push(memo)
          memo = null
        }
        result.push(sol)
      }
    })
    if (memo) {
      memo.debut = memo.debut.startOf('day')
      memo.fin = memo.fin.endOf('day')
      result.push(memo)
    }
    this.sols = result
  }

  buildPlanning() {
    const acheminements = _.remove(this.rotations, rotation => rotation.countVol === 0 && rotation.countMEP > 0)
    _.forEach(acheminements, group => {
      _.forEach(group.sv, mep => { mep.tag = 'mep' })
      this.sols.push(...group.sv)
    })
    this.planning = _.sortBy(this.sols.concat(this.rotations), ['debut', 'fin'])
  }

  printPlanning() {
    console.log('--- PLANNING ---')
    _.forEach(this.planning, evt => {
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
    })
    console.log('----------------')
  }

  _findTag(code) {
    return findTag(code)
  }

  _parseTime(timeStr) {
    if (TIME_REG.test(timeStr)) {
      const [hour, minute] = timeStr.split(':')
      return { hour, minute }
    } else {
      if (timeStr !== '>>>') console.log("Format d'heure incorrect : ", timeStr)
      return undefined
    }
  }

  _parseDuration(timeStr) {
    if (TIME_REG.test(timeStr)) {
      const [hours, minutes] = timeStr.split(':')
      return Duration.fromObject({ hours, minutes }).as('hours')
    } else {
      throw new Error('Format de durée incorrect.')
    }
  }

  _parsePeq(peq) {
    const result = {}
    let key = null
    peq.split(/\n/g).forEach(line => {
      if (CREW_TITLE_REG.test(line)) {
        // console.log(`Clé trouvée : ${line}`)
        key = line.split(':')[0]
        result[key] = []
      } else if (CREW_LIST_REG.test(line)) {
        // console.log(`Liste de trigrammes : ${line}`)
        if (key) {
          line.trim().split(' ').forEach(code => {
            const crew = {
              name: '',
              crewCode: code.trim().replace('©', '')
            }
            if (code.includes('©')) crew.cpt = '©'
            result[key].push(crew)
          })
        }
      } else if (CREW_LINE_REG.test(line)) {
        // console.log(`Membre d'équipage : ${line}`)
        const m = line.match(CREW_LINE_REG)
        if (key && m && m.length) {
          const crew = {
            name: m[1].trim().replace('©', ''),
            crewCode: m[3]
          }
          if (m[1].includes('©')) crew.cpt = true
          result[key].push(crew)
        }
      } else {
        // console.log(`Ligne inconnue : ${line}`)
      }
    })
    return result
  }

  _parseInstruction(str) {
    const groups = [...str.matchAll(/(^([A-z0-9_][A-z0-9_ ]+)\n)|(\n([A-z0-9_][A-z0-9_ ]+)\n)/g)]
    if (groups.length) {
      return _.chain(groups)
        .map((match, index) => {
          if (match && match.length >= 5) {
            const result = {
              code: (match[2] || match[4]).replace(/\s/g, '_')
            }
            const endOfGroup = index === groups.length - 1 ? str.length : groups[index + 1].index
            const sub = str.substring(match.index + result.code.length, endOfGroup)
            result.peq = {}
            let key = null
            sub.split(/\n/g).forEach(line => {
              if (/\w+\.?\s?:\s[A-Z]{3}/.test(line)) {
                const [_key, code] = line.split(':')
                key = _key.trim().replace('.', '')
                result.peq[key] = [code.trim()]
              } else if (CREW_LIST_REG.test(line) && key) {
                result.peq[key].push(...line.trim().split(' '))
              }
            })

            const details = findCodeInstruction(result.code)
            if (details) _.extend(result, details)

            const fonction = _.findKey(result.peq, peq => _.includes(peq, this.meta.trigramme))
            switch (fonction) {
              case 'Ins':
              case 'Inst':
                result.fonction = 'instructeur'
                break
              case 'Tr':
                result.fonction = 'stagiaire'
                break
              case 'StIn':
                result.fonction = 'support'
                break
              case undefined:
                break
              default:
                result.fonction = fonction
            }

            return result
          }
          return undefined
        })
        .filter(r => !_.isEmpty(r))
        .value()
    }
    return undefined
  }
}
