import { DateTime } from 'luxon'
import { assign, find, forEach, flatMap, groupBy, last, countBy, some, isEqual, isEmpty, sortBy } from 'lodash'
import { ALLDAY_TAGS } from '@/data/tags'
import { findTag } from '@/helpers/events.js'

const TIMEZONE = 'Europe/Paris'

/*
* ActivityTypes
* F: Flight
* S: Shuttle or Transfer
* T: Train
* G: Ground
* O / P : DHD or MEP
*/

/*
* GroundTypes
* O: OFF
* V: Vacation
* A: Absence (Maladie, Congés exceptionnels,...)
* G: Activité sol
* N: JISAP, NPL
* S: Simulateur
*/

export class CrewConnectPlanningParser {
  constructor () {
    this.days = []
    this.events = []
    this.rotations = []
    this.sols = []
    this.planning = []
    this.crews = new Map()
  }

  /**
   * Parse the planning data from the CrewConnect API
   * @param {Object} planningData
   * @param {Array} planningData.localCalendar
   * @param {String} planningData.crewCode
   * @param {Object} planningData.rosterState
   * @returns {Object}
   */
  parse({ localCalendar, crewCode, rosterState }) {
    if (this.planning.length) throw new Error('Planning already parsed')

    const rawEvents = []
    this.days = []

    localCalendar.forEach(({ day, crewActivities, crewDutyDays, crewStatuses, crewBonusDtos, afterPublishedDate }) => {
      this.days.push({
        date: DateTime.fromISO(day, { zone: TIMEZONE }),
        isoDate: day.substring(0, 10),
        crewStatuses,
        crewBonus: crewBonusDtos,
        isBlank: isEmpty(crewActivities) && isEmpty(crewDutyDays),
        afterPublishedDate
      })
      rawEvents.push(...crewActivities)
    })

    this.addBlankDays()

    const eventsByType = groupBy(rawEvents, 'activityType')

    const pairings = []
    const grounds = []
    const activitiesIndex = new Set()

    rawEvents.forEach(evt => {
      if (!activitiesIndex.has(evt.opsLegCrewId)) {
        if (evt.crewPairingId) {
          pairings.push(evt)
        } else {
          this.addGround(evt)
        }
        activitiesIndex.add(evt.opsLegCrewId)
      }
    })

    const groupedPairings = groupBy(pairings, 'crewPairingId')

    console.log(groupedPairings, countBy(rawEvents, 'activityType'))
    
    forEach(groupedPairings, (events, pairingId) => {
      this.addPairing(pairingId, events)
    })

    this.buildPlanning()

    return {
      userId: crewCode,
      profile: this.crews.get(crewCode),
      planning: this.planning,
      crews: [ ...this.crews.values() ],
      requestDate: rosterState.requestDate
    }
  }

  addBlankDays() {
    const blanks = []
    this.days.forEach(({ date, isBlank, afterPublishedDate }) => {
      if (isBlank && !afterPublishedDate) {
        const endOfDay = date.endOf('day')
        if (blanks.length && last(blanks).fin.hasSame(date.minus({ days: 1}), 'day')) {
          assign(last(blanks), {
            end: endOfDay.toISO(),
            fin: endOfDay
          })
        } else {
          blanks.push({
            tag: 'blanc',
            category: 'BLANC',
            summary: 'Blanc',
            start: date.toISO(),
            end: endOfDay.toISO(),
            fin: endOfDay
          })
        }
      }
    })
    this.events.push(...blanks)
    this.sols.push(...blanks)
  }

  addPairing(pairingId, events) {
    const groupedDuties = Object.values(groupBy(events, evt => [ evt.checkIn, evt.checkOut ].join('_')))
    const duties = []
    
    forEach(groupedDuties, (evts) => {
      const dutyEvents = evts.map(evt => this.transformEvent(evt))

      // Add hotel information to preceding duty
      if (dutyEvents.length === 1 && dutyEvents[ 0 ].tag === 'hotel') {
        if (duties.length) {
          last(duties).hotel = dutyEvents[ 0 ]
        } else {
          // throw new Error("No duty found before hotel event !")
        }
        return
      }

      const firstEvt = evts[ 0 ]
      const tag = this.findDutyTag(dutyEvents)
      
      const duty = {
        opsLegCrewId: firstEvt.opsLegCrewId.toString(),
        tag,
        start: firstEvt.checkIn,
        end: firstEvt.checkOut,
        summary: tag === 'sv' ? firstEvt.flightDutyType : firstEvt.description,
        events: dutyEvents
      }

      this.extendWithCrewRemarksTraining(duty, firstEvt)

      // Optimize crews, remarks and instruction props
      if (dutyEvents.length) {
        dutyEvents.forEach(evt => {
          [ 'peq', 'remarks', 'instruction' ].forEach(prop => {
            if (!isEmpty(evt[ prop ]) && isEqual(evt[ prop ], duty[ prop ])) {
              delete evt[ prop ]
            }
          })
        })
      }

      duties.push(duty)
    })
    
    if (some(duties, { tag: 'sv'})) {
      const rotation = {
        crewPairingId: pairingId,
        tag: 'rotation',
        start: events[0].pairingCheckin,
        end: events[0].pairingCheckout,
        sv: duties
      }
      this.rotations.push(rotation)
    } else {
      this.sols.push(...duties)
    }
  }

  transformEvent(evt) {
    switch (evt.activityType) {
      case 'F':
        return this.transformFlight(evt)
      case 'S':
      case 'P':
      case 'O':
      case 'T':
        return this.transformMEP(evt)
      case 'G':
        return this.transformGround(evt)
      case 'H':
        return this.transformHotel(evt)
      default:
        console.log('Unknown activity type', evt)
        return
    }
  }

  findDutyTag(events) {
    if (events.length === 1) {
      const firstEvent = events[ 0 ]
      return firstEvent.tag === 'vol' ? 'sv' : firstEvent.tag
    }

    if (some(events, evt => evt.tag === 'vol')) {
      return 'sv'
    }

    const firstSol = find(events, evt => evt.tag !== 'mep')
    if (firstSol) {
      const specialCategoryEvent = find(events, evt => ['simu', 'stage', 'syndicat', 'reserve'].includes(evt.tag))
      return specialCategoryEvent ? specialCategoryEvent.tag : firstSol.tag
    } else {
      return 'mep'
    }
  }

  transformFlight(evt) {
    const vol = {
      opsLegCrewId: evt.opsLegCrewId.toString(),
      tag: 'vol',
      start: evt.start,
      end: evt.end,
      category: evt.activityType,
      num: evt.flightNumber,
      summary: evt.details,
      from: evt.departureAirportCode,
      depTz: evt.departureAirportTimeZone,
      to: evt.arrivalAirportCode,
      arrTz: evt.arrivalAirportTimeZone,
      immat: evt.flightAircraftRegistration,
      type: evt.flightAircraftVersion,
      fonction: evt.flightRole,
      pax: evt.paxDetails?.paxEcoFare
    }
    this.extendWithCrewRemarksTraining(vol, evt)
    return vol
  }

  transformMEP(evt) {
    const mep = {
      opsLegCrewId: evt.opsLegCrewId.toString(),
      tag: 'mep',
      start: evt.start,
      end: evt.end,
      category: evt.activityType,
      num: evt.deadheadDescription,
      summary: evt.description,
      from: evt.departureAirportCode,
      fromTZ: evt.departureAirportTimeZone,
      to: evt.arrivalAirportCode,
      toTZ: evt.arrivalAirportTimeZone,
      fonction: evt.flightRole,
      pax: evt.paxDetails?.paxEcoFare
    }
    this.extendWithCrewRemarksTraining(mep, evt)
    return mep
  }

  transformGround(evt) {
    const ground = {
      opsLegCrewId: evt.opsLegCrewId.toString(),
      tag: findTag(evt.groundCode),
      start: evt.start,
      end: evt.end,
      category: evt.groundCode,
      summary: evt.description
    }
    this.extendWithCrewRemarksTraining(ground, evt)
    return ground
  }

  transformHotel(evt) {
    return {
      opsLegCrewId: evt.opsLegCrewId.toString(),
      tag: 'hotel',
      summary: evt.details ?? '',
      name: evt.hotelName ?? '',
      address: evt.hotelAddress ?? '',
      email: evt.hotelEmail ?? '',
      phone: evt.hotelPhoneNumber ?? '',
      room: evt.roomTypeDescription ?? ''
    }
  }

  addGround(evt) {
    if (evt.checkIn !== evt.start || evt.checkOut !== evt.end) {
      console.info('Ground with different start/end', evt)
    }

    const startDT = DateTime.fromISO(evt.start).setZone(TIMEZONE)
    const endDT = DateTime.fromISO(evt.end).setZone(TIMEZONE)

    const ground = {
      opsLegCrewId: evt.opsLegCrewId.toString(),
      tag: this.findGroundTag(evt),
      start: evt.start,
      end: evt.end,
      debut: startDT,
      fin: endDT,
      category: evt.groundCode,
      summary: evt.description
    }

    this.extendWithCrewRemarksTraining(ground, evt)

    if (this.sols.length && ALLDAY_TAGS.includes(ground.tag)) {
      const prev = this.sols[ this.sols.length - 1 ]
      if (prev.category === ground.category &&
          prev.summary === ground.summary &&
          prev.remarks === ground.remarks &&
          prev.fin.plus({ days: 1 }).hasSame(ground.debut, 'day')) {
        prev.fin = ground.fin
        prev.end = ground.end
        return
      }
    }

    this.sols.push(ground)
  }

  findGroundTag(evt) {
    switch (evt.groundType) {
      case 'O':
        return 'repos'
      case 'V':
        return 'conges'
      default:
        return findTag(evt.groundCode)
    }
  }

  extendWithCrewRemarksTraining(transformedEvent, evt) {
    if (evt.crews?.length) {
      transformedEvent.peq = this.mapAndSaveCrews(evt.crews)
    }

    if (evt.remarks) {
      transformedEvent.remarks = evt.remarks
    }

    if (evt.trainingDetails?.length) {
      transformedEvent.instruction = evt.trainingDetails
    }
    return transformedEvent
  }

  mapAndSaveCrews(crews) {
    const crewList = []
    forEach(crews, (crew) => {
      this.crews.set(crew.crewCode, crew)
      crewList.push({
        crewCode: crew.crewCode,
        fct: crew.title,
        cpt: crew.captain
      })
    })
    return crewList
  }

  buildPlanning() {
    this.planning = sortBy(this.sols.concat(this.rotations), ['start', 'end'])
  }

  printPlanning() {
    console.log('--- PLANNING ---')
    this.planning.forEach(evt => {
      if (evt.tag === 'rotation') {
        console.log(`[ROTATION] ${evt.start}`)
        evt.sv.forEach(sv => {
          if (sv.fromHotel) console.log(`{...HOTEL} ${sv.fromHotel.summary}`)
          console.log(`[${sv.tag}] ${sv.summary} - ${sv.start}`)
          sv.events.forEach(etape => console.log(`-> ${etape.summary} - ${etape.start}`))
          if (sv.hotel) console.log(`{HOTEL} ${sv.hotel.summary}`)
        })
      } else {
        console.log(`[${evt.tag}] (${evt.summary}) ${evt.start}`)
        if (evt.events && evt.events.length) {
          evt.events.forEach(subEvt => console.log(`-> ${subEvt.tag} - ${subEvt.summary} - ${subEvt.start}`))
        }
      }
    })
    console.log('----------------')
  }
    
}