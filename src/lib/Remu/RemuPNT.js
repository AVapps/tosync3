import { DateTime, Interval, Settings } from 'luxon'
import Big from 'big.js'
import _ from 'lodash'

import { SOL_TAGS, TAGS } from '@/data/tags'
import { TVref } from '@/model/TVref'

import CONFIG_AF from './configAF'
import CONFIG_TO from './configTO'
// import CONFIG_RU from './configRU'

Big.DP = 2

Big.max = (...args) => {
  let i
  let y
  let x = new Big(args[0])
  for (i = 1; i < args.length; i++) {
    y = new Big(args[i])
    if (x.lt(y)) x = y
  }
  return x
}

Big.min = (...args) => {
  let i
  let y
  let x = new Big(args[0])
  for (i = 1; i < args.length; i++) {
    y = new Big(args[i])
    if (x.gt(y)) x = y
  }
  return x
}

const TIMEZONE = 'Europe/Paris'
Settings.defaultLocale = 'fr'
Settings.defaultZoneName = TIMEZONE

function toDateTime(millis) {
  return DateTime.fromMillis(millis, { zone: TIMEZONE })
}

function duree(debut, fin) {
  if (!DateTime.isDateTime(debut)) {
    debut = DateTime.fromMillis(debut)
  }
  if (!DateTime.isDateTime(fin)) {
    fin = DateTime.fromMillis(fin)
  }
  return Big(fin.diff(debut).as('hours'))
}

function nj(debut, fin) {
  if (!DateTime.isDateTime(debut)) {
    debut = DateTime.fromMillis(debut)
  }
  if (!DateTime.isDateTime(fin)) {
    fin = DateTime.fromMillis(fin)
  }
  return fin.startOf('day').diff(debut.startOf('day')).as('days') + 1
}

function jours(events, month) {
  const dates = new Set()
  _.forEach(events, evt => {
    if (evt.end < evt.start) throw new Error('Fin d\'évènement antérieur au début.')
    let date = toDateTime(evt.start).startOf('day')
    const fin = toDateTime(evt.end)

    while (date <= fin) {
      if (date.month === month.month) {
        dates.add(date.toISODate())
      }
      date = date.plus({ days: 1 })
    }
  })
  return dates
}

function sumBy(collection, key) {
  return _.reduce(collection, (sum, object) => {
    if (_.has(object, key)) {
      return sum.plus(_.get(object, key) || 0)
    } else {
      return sum
    }
  }, Big(0))
}

function sumRemuByMonth(collection, key, month, startKey = 'debut') {
  return _.reduce(collection, (sum, object) => {
    // L'objet a un objet split
    if (_.has(object.remu, ['split', month, key].join('.'))) {
      return sum.plus(_.get(object.remu, ['split', month, key].join('.')) || 0)
    // L'objet a un DateTime Luxon de début
    } else if (_.has(object.remu, key) && _.has(object.remu, startKey) && _.get(object.remu, startKey).month === month) {
      return sum.plus(_.get(object.remu, key) || 0)

    // L'objet a un timestamp de début
    } else if (_.has(object.remu, key) && _.has(object, 'start') &&
      toDateTime(_.get(object, 'start')).month === month) {
      return sum.plus(_.get(object.remu, key) || 0)
    } else {
      return sum
    }
  }, Big(0))
}

function hdn(debut, fin, configHDN) {
  if (!DateTime.isDateTime(debut)) {
    debut = DateTime.fromMillis(debut)
  }
  if (!DateTime.isDateTime(fin)) {
    fin = DateTime.fromMillis(fin)
  }
  debut = debut.setZone(TIMEZONE)
  fin = fin.setZone(TIMEZONE)
  const interval = Interval.fromDateTimes(debut, fin)
  const nightEnd = debut.set(configHDN.nightEnd)
  const nightStart = debut.set(configHDN.nightStart)
  const prevNight = Interval.fromDateTimes(debut.startOf('day'), nightEnd)
  const nextNight = Interval.fromDateTimes(nightStart, nightStart.plus({ days: 1 }).set(configHDN.nightEnd))

  const prevInt = interval.intersection(prevNight)
  const nextInt = interval.intersection(nextNight)

  return Big((prevInt ? prevInt.length('hours') : 0) + (nextInt ? nextInt.length('hours') : 0))
}

export function remuRotation(rot) {
  const remu = {}
  _.forEach(rot.sv, sv => {
    _.forEach(sv.events, s => {
      if (s.tag === 'vol') {
        s.remu = remuVol(s)
      }
      if (s.tag === 'mep') {
        s.remu = remuMEP(s)
      }
    })
    sv.remu = remuSV(sv)
  })

  const vols = _.flatMap(rot.sv, sv => _.filter(sv.events, { tag: 'vol' }))
  const meps = _.flatMap(rot.sv, sv => _.filter(sv.events, { tag: 'mep' }))

  _.forEach(['tv', 'tvp'], key => {
    remu[key] = sumBy(vols, `remu.${key}`)
  })

  remu.mep = sumBy(meps, 'remu.mep')

  _.forEach(['countVol', 'countMEP', 'H1TO', 'H1AF', 'H1rAF', 'HVnuit', 'TSVnuit'], key => {
    remu[key] = sumBy(rot.sv, `remu.${key}`)
  })

  const debutAbs = _.first(rot.sv).remu.debutTR // (!) normalement le temps d'absence débute en fonction de l'heure programmée uniquement / debutTR est calculé en prenant en compte le bloc réalisé si antérieur
  const lastSV = _.last(rot.sv)
  const finAbsTOprog = lastSV.remu.countVol ? lastSV.remu.finTRprog : lastSV.remu.finTR
  const finAbsAFprog = lastSV.remu.countVol ? lastSV.remu.finTSVrAFprog : lastSV.remu.finTR

  remu.nbjoursTO = finAbsTOprog.startOf('day').diff(debutAbs.startOf('day'), 'days').as('days') + 1
  remu.nbjoursAF = finAbsAFprog.startOf('day').diff(debutAbs.startOf('day'), 'days').as('days') + 1

  if (lastSV.remu.finTR.day === finAbsTOprog.day + 1 && lastSV.remu.finTR.hour >= 1) rot.nbjoursTO++
  if (lastSV.remu.finTSVrAF.day === finAbsAFprog.day + 1 && lastSV.remu.finTSVrAF.hour >= 1) rot.nbjoursAF++

  remu.HcaTO = remu.nbjoursTO * CONFIG_TO.hcaParJour
  remu.HcaAF = remu.nbjoursAF * CONFIG_AF.hcaParJour

  remu.H2TO = Big.max(remu.HcaTO, remu.H1TO)
  remu.H2AF = Big.max(remu.HcaAF, remu.H1AF)
  remu.H2rAF = Big.max(remu.HcaAF, remu.H1rAF)

  const debut = debutAbs
  const fin = lastSV.remu.finTSVrAF

  if (debut.month !== fin.month) {
    remu.split = {
      [debut.month]: {
        TSVnuit: sumRemuByMonth(rot.sv, 'TSVnuit', debut.month, 'remu.debutTR'),
        countVol: _.reduce(vols, (count, s) => (toDateTime(s.start).month === debut.month) ? count + 1 : count, 0),
        tv: sumRemuByMonth(vols, 'tv', debut.month),
        tvp: sumRemuByMonth(vols, 'tvp', debut.month),
        mep: sumRemuByMonth(meps, 'mep', debut.month),
        HVnuit: sumRemuByMonth(vols, 'HVnuit', debut.month),
        nbjours: debut.endOf('month').diff(debut.endOf('day')).as('days') + 1
      },
      [fin.month]: {
        TSVnuit: sumRemuByMonth(rot.sv, 'TSVnuit', fin.month, 'remu.debutTR'),
        countVol: _.reduce(vols, (count, s) => (toDateTime(s.start).month === fin.month) ? count + 1 : count, 0),
        tv: sumRemuByMonth(vols, 'tv', fin.month),
        tvp: sumRemuByMonth(vols, 'tvp', fin.month),
        mep: sumRemuByMonth(meps, 'mep', fin.month),
        HVnuit: sumRemuByMonth(vols, 'HVnuit', fin.month),
        nbjours: fin.startOf('day').diff(fin.startOf('month')).as('days') + 1
      }
    }

    const prorata = {
      [debut.month]: remu.split[debut.month].tv.plus(remu.split[debut.month].mep.div(2)).div(remu.tv.plus(remu.mep.div(2))),
      [fin.month]: remu.split[fin.month].tv.plus(remu.split[fin.month].mep.div(2)).div(remu.tv.plus(remu.mep.div(2)))
    }

    _.assign(remu.split[debut.month], {
      H2TO: Big(remu.H2TO).times(prorata[debut.month]),
      H2AF: Big(remu.H2AF).times(prorata[debut.month]),
      H2rAF: Big(remu.H2rAF).times(prorata[debut.month])
    })

    _.assign(remu.split[fin.month], {
      H2TO: Big(remu.H2TO).times(prorata[fin.month]),
      H2AF: Big(remu.H2AF).times(prorata[fin.month]),
      H2rAF: Big(remu.H2rAF).times(prorata[fin.month])
    })
  }

  _.forEach(rot.sv, sv => {
    _.forEach(sv.events, s => {
      s.remu = exportRemuData(s.remu)
    })
    sv.remu = exportRemuData(sv.remu)
  })

  return exportRemuData(remu)
}

export function remuSV(sv) {
  const counts = _.defaults(_.countBy(sv.events, 'tag'), { vol: 0, mep: 0 })
  const groups = _.defaults(_.groupBy(sv.events, 'tag'), { vol: [], mep: [] })

  const remu = {
    tv: counts.vol ? sumBy(groups.vol, 'remu.tv') : 0,
    tvp: counts.vol ? sumBy(groups.vol, 'remu.tvp') : 0,
    mep: counts.mep ? sumBy(groups.mep, 'remu.mep') : 0,
    HVnuit: counts.vol ? sumBy(groups.vol, 'remu.HVnuit') : 0,
    countVol: counts.vol,
    countMEP: counts.mep
  }

  remu.tme = counts.vol ? remu.tv.div(counts.vol) : 0
  remu.cmt = counts.vol ? Big.max(Big(70).div(Big.max(remu.tme, 1).times(21).plus(30)), 1) : 0

  const first = _.first(sv.events)
  const last = _.last(sv.events)
  const lastVol = _.last(groups.vol)

  if (sv.tag === 'sv') {
    remu.debutTR = toDateTime(first.tag === 'vol' ? Math.min(first.std, first.start) : first.start, { zone: TIMEZONE }).minus({ hours: CONFIG_TO.preTR })
    remu.finTRprog = toDateTime(lastVol.sta).plus({ hours: CONFIG_TO.postTR })
    remu.finTSVrAFprog = toDateTime(last.sta || last.end).plus({ hours: CONFIG_AF.postTSVr })
    remu.finTR = toDateTime(lastVol.end).plus({ hours: CONFIG_TO.postTR })
    remu.finTSVrAF = toDateTime(last.end).plus({ hours: CONFIG_AF.postTSVr })
    remu.HctTO = Math.max(duree(remu.debutTR, remu.finTR), CONFIG_TO.TRMini) * CONFIG_TO.coefTR

    const tsvrAF = duree(remu.debutTR, remu.finTSVrAF)
    if (CONFIG_AF.coefTSV10 && tsvrAF.gt(10)) {
      remu.HctAF = tsvrAF.times(CONFIG_AF.coefTSV10)
    } else {
      remu.HctAF = Big.max(tsvrAF, CONFIG_AF.tsvMini).times(CONFIG_AF.coefTSV)
    }
  } else {
    remu.debutTR = toDateTime(first.start).minus({ hours: CONFIG_TO.preTR })
    remu.finTR = remu.debutTR
    remu.finTSVrAF = toDateTime(last.end).plus({ hours: CONFIG_AF.postTSVr })
    remu.HctTO = 0
    remu.HctAF = duree(remu.debutTR, remu.finTSVrAF).times(CONFIG_AF.coefTSV)
  }

  remu.HcvTO = sumBy(groups.vol, 'remu.hv100TO').times(remu.cmt).plus(sumBy(groups.mep, 'mep').div(2))
  remu.H1TO = Big.max(remu.HctTO, remu.HcvTO)
  remu.HcvAF = sumBy(groups.vol, 'remu.hv100AF').times(remu.cmt).plus(sumBy(groups.mep, 'mep').div(2))
  remu.HcvrAF = sumBy(groups.vol, 'remu.hv100rAF').times(remu.cmt).plus(sumBy(groups.mep, 'mep').div(2))
  remu.H1AF = Big.max(remu.HctAF, remu.HcvAF)
  remu.H1rAF = Big.max(remu.HctAF, remu.HcvrAF)

  if (sv.tag === 'mep') {
    remu.TSVnuit = 0
  } else {
    const MEPnuit = counts.mep
      ? _.reduce(groups.mep, (sum, evt) => {
        if (evt.tag === 'mep') {
          return hdn(evt.start, evt.end, CONFIG_AF.hdn).plus(sum)
        } else {
          return sum
        }
      }, 0)
      : 0
    remu.TSVnuit = hdn(remu.debutTR, remu.finTSVrAF, CONFIG_AF.hdn).minus(MEPnuit)

    if (remu.debutTR.month !== remu.finTSVrAF.month) {
      const splitMEPnuit = counts.mep
        ? _.reduce(sv.events, (split, evt) => {
          if (evt.tag === 'mep') {
            const debut = toDateTime(evt.start)
            const fin = toDateTime(evt.end)
            if (debut.month !== fin.month) {
              split[debut.month] = hdn(debut, debut.endOf('month'), CONFIG_AF.hdn).plus(split[debut.month])
              split[fin.month] = hdn(fin.startOf('month'), fin, CONFIG_AF.hdn).plus(split[fin.month])
              return split
            } else {
              split[debut.month] = hdn(debut, fin, CONFIG_AF.hdn).plus(split[debut.month])
              return split
            }
          } else {
            return split
          }
        }, { [remu.debutTR.month]: 0, [remu.finTSVrAF.month]: 0 })
        : 0

      remu.split = {
        [remu.debutTR.month]: {
          TSVnuit: hdn(remu.debutTR, remu.debutTR.endOf('month'), CONFIG_AF.hdn).minus(splitMEPnuit[remu.debutTR.month])
        },
        [remu.finTSVrAF.month]: {
          TSVnuit: hdn(remu.finTSVrAF.startOf('month'), remu.finTSVrAF, CONFIG_AF.hdn).minus(splitMEPnuit[remu.finTSVrAF.month])
        }
      }
    }
  }
  return remu
}

export function remuVol(vol) {
  const remu = {}
  const debut = toDateTime(vol.std)
  const fin = toDateTime(vol.sta)
  const debutR = toDateTime(vol.start)
  const finR = toDateTime(vol.end)

  _.assign(remu, { debut, fin, debutR, finR })

  remu.tvp = duree(debut, fin)
  remu.tv = duree(debutR, finR)

  const debutNuit = toDateTime(Math.min(vol.std, vol.start))
  const finNuit = debutNuit.plus({ hours: vol.tv })
  remu.HVnuit = hdn(debutNuit, finNuit, CONFIG_TO.hdn)
  // console.log(vol, remu, debutNuit.toString(), finNuit.toString(), remu.HVnuit)

  if ((vol.from === 'CDG' && vol.to === 'ORY') || (vol.from === 'ORY' && vol.to === 'CDG')) {
    remu.pogo = true
    remu.hv100TO = Big(CONFIG_TO.hcPogo)
    remu.hv100AF = Big(CONFIG_AF.hcPogo)
    remu.hv100rAF = Big(CONFIG_AF.hcPogo)
  } else {
    // console.log(`${vol.from}-${vol.to}`, TVref.find('TOA', vol), TVref.find('TOB', vol))
    remu.hv100TO = Big(TVref.find('TOA', vol) || remu.tvp)
    remu.tvrefAF = Big(TVref.find('TOB', vol) || remu.tvp)
    remu.hv100AF = Big.max(remu.tvrefAF, remu.tv)
    remu.hv100rAF = remu.tvrefAF.plus(CONFIG_AF.bonusEtape) // TODO: Bonus majoré des étapes de plus de 2100 (aucune à ce jour)
  }

  if (debutR.month !== finR.month) {
    remu.split = {
      [debutR.month]: {
        HVnuit: hdn(debutNuit, debutR.endOf('month'), CONFIG_TO.hdn),
        tv: duree(debutR, debutR.endOf('month')),
        tvp: duree(debut, debut.endOf('month'))
      },
      [finR.month]: {
        HVnuit: hdn(finR.startOf('month'), finNuit, CONFIG_TO.hdn),
        tv: duree(finR.startOf('month'), finR),
        tvp: duree(fin.startOf('month'), fin)
      }
    }
  }
  return remu
}

export function remuMEP(mep) {
  const debut = toDateTime(mep.start)
  const fin = toDateTime(mep.end)
  const remu = {
    mep: mep.category === 'ENGS' ? 0 : duree(debut, fin),
    tv: Big(0),
    tvp: Big(0),
    HVnuit: Big(0)
  }

  if (debut.month !== fin.month) {
    remu.split = {
      [debut.month]: {
        mep: duree(debut, debut.endOf('month'))
      },
      [fin.month]: {
        mep: duree(fin.startOf('month'), fin)
      }
    }
  }

  return remu
}

export function remuSimuAF(simu) {
  let Hsimu
  if (_.has(simu, 'events')) {
    Hsimu = _.reduce(simu.events, (h, s) => {
      if (s.tag === 'simu') {
        return duree(s.start, s.end).plus(h)
      } else {
        return h
      }
    }, 0)
  } else {
    Hsimu = duree(simu.start, simu.end)
  }
  return exportRemuData({
    HcsAF: Hsimu.gt(2) ? CONFIG_AF.HcSimu : CONFIG_AF.HcDemiSimu
  })
}

export function remuSimuInstAF(simu) {
  let Hsimu
  if (_.has(simu, 'events')) {
    Hsimu = _.reduce(simu.events, (h, s) => {
      if (s.tag === 'instructionSimu' || s.tag === 'simu') {
        return duree(s.start, s.end).plus(h)
      } else {
        return h
      }
    }, 0)
  } else {
    Hsimu = duree(simu.start, simu.end)
  }

  const HsimuNuit = hdn(simu.start, simu.end, CONFIG_AF.hdnSimuInstruction)

  const remu = {
    HcsAF: Hsimu.gt(2) ? CONFIG_AF.HcSimuInstruction : CONFIG_AF.HcDemiSimuInstruction,
    PVAF: Hsimu.gt(2) ? CONFIG_AF.PVSimuInstruction : CONFIG_AF.PVDemiSimuInstruction,
    majoNuitPVAF: HsimuNuit.times(CONFIG_AF.coefMajoNuit)
  }

  // TODO : rémunération majorée des intructeurs référents

  if (_.has(simu, 'instruction.own')) {
    const tags = _.flatMap(simu.instruction.own, task => task.tags)
    if (tags.includes('cdb') || tags.includes('qt')) {
      // majoration de 6,5% de la rémunération des séances intégration et lâcher CDB
      remu.PVAF = Big(remu.PVAF).times(1.065)
    }
  }

  return exportRemuData(remu)
}

export function remuJourSol(day) {
  const sols = day.events.filter(evt => _.includes(SOL_TAGS, evt.tag))

  if (!sols.length) return
  const dayDate = DateTime.fromISO(day.date)

  const jourSol = {
    debut: DateTime.max(toDateTime(_.first(sols).start), dayDate.startOf('day')),
    fin: DateTime.min(toDateTime(_.last(sols).end), dayDate.endOf('day')),
    tag: _.first(sols).tag,
    events: sols
  }

  if (sols.length > 1) {
    const specialCategoryEvent = _.find(sols, evt => _.includes(['simu', 'instructionSol', 'instructionSimu', 'stage', 'delegation', 'reserve'], evt.tag))
    if (specialCategoryEvent) {
      jourSol.tag = specialCategoryEvent.tag
    }
  }

  if (jourSol.tag === 'sol' || jourSol.tag === 'reserve') {
    return {
      tag: jourSol.tag,
      HcsAF: isDemiJournée(jourSol, 13) ? CONFIG_AF.demiHcs : CONFIG_AF.Hcs,
      HcsTO: isDemiJournée(jourSol, 12) ? CONFIG_TO.demiHcs : CONFIG_TO.Hcs
    }
  }

  if (jourSol.tag === 'simu') {
    return {
      tag: jourSol.tag,
      HcsTO: isDemiJournée(jourSol, 12) ? CONFIG_TO.demiHcs : CONFIG_TO.Hcs
    }
  }

  if (jourSol.tag === 'instructionSimu') {
    const Hcsnuit = hdn(jourSol.debut, jourSol.fin, CONFIG_TO.hdn)
    return {
      tag: jourSol.tag,
      HcSimuInstTO: CONFIG_TO.HcSimuInst + Hcsnuit * CONFIG_TO.coefMajoNuit
    }
  }

  if (jourSol.tag === 'stage') {
    return {
      tag: jourSol.tag,
      HcsAF: isDemiJournée(jourSol, 13) ? CONFIG_AF.demiHcs : CONFIG_AF.Hcs
    }
  }

  if (jourSol.tag === 'instructionSol') {
    const isDemiJournéeAF = isDemiJournée(jourSol, 13)
    return {
      tag: jourSol.tag,
      HcsAF: isDemiJournéeAF ? CONFIG_AF.HcDemiInsructionSol : CONFIG_AF.HcInsructionSol,
      PVAF: isDemiJournéeAF ? CONFIG_AF.PVDemiInsructionSol : CONFIG_AF.PVInsructionSol,
      HcsiTO: isDemiJournée(day, 12) ? CONFIG_TO.demiHcsi : CONFIG_TO.Hcsi
    }
  }

  if (jourSol.tag === 'delegation') {
    return {
      tag: jourSol.tag,
      HcsAF: CONFIG_AF.HcDelegation,
      PVAF: CONFIG_AF.PVDelegation,
      HcsrTO: CONFIG_TO.Hcsr
    }
  }
}

/**
 *
 * @param {DateTime} month
 * @param {Array<event>} events
 * @param {Array<day>} days
 * @returns object
 */
export function remuMois(month, events, days) {
  const stats = {
    NJ: 0,
    TO: {
      HCm: 0,
      HCgm: 0,
      HCrm: 0,
      Hcs: 0,
      Hcsi: 0,
      HcSimuInst: 0,
      Hcsr: 0,
      NJstage: 0
    },
    AF: {
      HCgm: 0,
      HC: 0,
      PVrm: 0,
      PV: 0,
      Hcs: 0,
      HcsStage: 0
    },
    count: {},
    nbjours: {}
  }

  const debutMois = month.startOf('month')
  const finMois = month.endOf('month')

  // Filtrer les évènements du mois et les grouper par tag
  const start = debutMois.toMillis()
  const end = finMois.toMillis()
  const eventsByTag = _.chain(events)
    .filter(evt => (evt.end >= start && evt.start <= end))
    .groupBy('tag')
    .value()
  console.log(events, days, eventsByTag)

  // Filtrer les jours du mois
  const joursMois = filterDaysByDates(days, debutMois, finMois)
  const joursActSol = _.filter(joursMois, day => _.has(day, 'remu'))

  // Compter les nombre de jours des évènements hors activité
  _.forEach(_.omit(TAGS, 'stage', 'sol', 'simu', 'instructionSol', 'instructionSimu', 'reserve', 'delegation', 'rotation', 'vol', 'mep'), tag => {
    stats.count[tag] = _.has(eventsByTag, tag)
      ? _.sumBy(eventsByTag[tag], evt => {
        const debut = DateTime.max(toDateTime(evt.start), debutMois)
        const fin = DateTime.min(toDateTime(evt.end), finMois)
        return nj(debut, fin)
      })
      : 0
  })

  // Prise en compte des jours de stage
  if (_.has(eventsByTag, 'stage') && _.get(eventsByTag, 'stage').length) {
    const stages = _.get(eventsByTag, 'stage')
    const stageStart = toDateTime(_.first(stages).start).toISODate()
    const stageEnd = toDateTime(_.last(stages).end).toISODate()

    _.forEach(joursActSol, day => {
      if (day.date >= stageStart && day.date <= stageEnd && day.remu.tag !== 'stage') {
        day.remu.tag = 'stage'
        day.tags = ['stage']
        day.remu.HcsAF = isDemiJournée(day, 13) ? CONFIG_AF.demiHcs : CONFIG_AF.Hcs
        day.remu.HcsTO = 65 / 30
      }
    })

    stats.TO.NJstage = nj(_.first(stages).start, _.last(stages).end)
  }

  const joursSolByTag = _.groupBy(joursActSol, 'remu.tag')
  console.log(joursMois, joursActSol, joursSolByTag)

  if (_.has(joursSolByTag, 'stage')) {
    stats.nbjours.stage = _.size(joursSolByTag.stage)
    stats.AF.HcsStage = _.sumBy(joursSolByTag.stage, 'remu.HcsAF')
  }

  if (_.has(joursSolByTag, 'sol')) {
    stats.nbjours.sol = _.size(joursSolByTag.sol)
    const HcsAF = _.sumBy(joursSolByTag.sol, 'remu.HcsAF')
    stats.AF.Hcs += HcsAF
    stats.AF.PVrm += HcsAF * CONFIG_AF.coefPVHC
    stats.TO.Hcs += _.sumBy(joursSolByTag.sol, 'remu.HcsTO')
  }

  if (_.has(joursSolByTag, 'reserve')) {
    stats.nbjours.reserve = _.size(joursSolByTag.reserve)
    const HcsAF = _.sumBy(joursSolByTag.reserve, 'remu.HcsAF')
    stats.AF.Hcs += HcsAF
    stats.AF.PVrm += HcsAF * CONFIG_AF.coefPVHC
    stats.TO.Hcs += _.sumBy(joursSolByTag.reserve, 'remu.HcsTO')
  }

  if (_.has(joursSolByTag, 'delegation')) {
    stats.nbjours.delegation = _.size(joursSolByTag.delegation)
    stats.AF.Hcs += _.sumBy(joursSolByTag.delegation, 'remu.HcsAF')
    stats.AF.PVrm += _.sumBy(joursSolByTag.delegation, 'remu.PVAF')
    stats.TO.Hcsr += _.sumBy(joursSolByTag.delegation, 'remu.HcsrTO')
  }

  if (_.has(joursSolByTag, 'simu')) {
    stats.nbjours.simu = _.size(joursSolByTag.simu)
    // const HcsAF = _.sumBy(joursSolByTag.simu, 'HcsAF')
    // stats.AF.Hcs += HcsAF
    // stats.AF.PVrm += HcsAF * CONFIG_AF.coefPVHC
    stats.TO.Hcs += _.sumBy(joursSolByTag.simu, 'remu.HcsTO')
  }

  if (_.has(joursSolByTag, 'instructionSol')) {
    stats.nbjours.instructionSol = _.size(joursSolByTag.instructionSol)
    stats.AF.Hcs += _.sumBy(joursSolByTag.instructionSol, 'remu.HcsAF')
    stats.AF.PVrm += _.sumBy(joursSolByTag.instructionSol, 'remu.PVAF')
    stats.TO.Hcsi += _.sumBy(joursSolByTag.instructionSol, 'remu.HcsiTO')
  }

  if (_.has(joursSolByTag, 'instructionSimu')) {
    stats.nbjours.instructionSimu = _.size(joursSolByTag.instructionSimu)
    // stats.AF.Hcs += _.sumBy(joursSolByTag.instructionSimu, 'HcsAF')
    // stats.AF.PVrm += _.sumBy(joursSolByTag.instructionSimu, 'PVAF') + _.sumBy(joursSolByTag.instructionSol, 'majoNuitPVAF')
    stats.TO.HcSimuInst += _.sumBy(joursSolByTag.instructionSimu, 'remu.HcSimuInstTO')
  }

  stats.TO.NJabs = stats.count.conges + stats.count.sanssolde + stats.count.maladie + stats.count.absence + stats.count.greve + stats.TO.NJstage
  stats.TO.trentiemes = 30 - stats.TO.NJabs
  stats.TO.seuilHS = Math.max(75 * stats.TO.trentiemes / 30, 16)

  stats.AF.NJabs = stats.count.conges + stats.count.sanssolde + stats.count.maladie + stats.count.absence + stats.count.greve
  stats.AF.trentiemes = 30 - stats.AF.NJabs
  stats.AF.seuilHS = Math.max(75 * stats.AF.trentiemes / 30, 16)

  _.forEach(['tv', 'tvp', 'mep', 'countVol'], key => {
    stats[key] = sumRemuByMonth(eventsByTag.rotation, key, month.month)
  })

  _.forEach(['HVnuit', 'H2TO'], key => {
    stats.TO[key.replace('TO', '')] = sumRemuByMonth(eventsByTag.rotation, key, month.month)
  })

  _.forEach(['TSVnuit', 'H2AF', 'H2rAF'], key => {
    stats.AF[key.replace('AF', '')] = sumRemuByMonth(eventsByTag.rotation, key, month.month)
  })

  stats.AF.PVrm += stats.AF.H2r * CONFIG_AF.coefPVHC

  const joursVol = [...jours(eventsByTag.rotation, month)]
  const joursSol = _.map(_.reject(joursActSol, { tag: 'stage' }), 'date')
  stats.NJVol = joursVol.length
  stats.NJSol = joursSol.length
  stats.NJ = _.union(joursVol, joursSol).length

  stats.TO.Hcnuit = stats.TO.HVnuit * CONFIG_TO.coefNuit
  stats.TO.HCm = stats.TO.H2 + stats.TO.Hcs + stats.TO.Hcnuit + stats.TO.Hcsi + stats.TO.Hcsr + stats.TO.HcSimuInst
  stats.TO.HCgm = stats.TO.NJstage ? 0 : stats.NJ * CONFIG_TO.hcgmParNJ
  stats.TO.HCrm = Math.max(stats.TO.HCm, stats.TO.HCgm)

  stats.AF.HCd = stats.AF.H2 + stats.AF.Hcs
  stats.AF.HCgm = stats.NJ * CONFIG_AF.hcParNJ
  stats.AF.HC = Math.max(stats.AF.HCd, stats.AF.HCgm) + stats.AF.HcsStage

  stats.AF.PVgm = stats.AF.HCgm * CONFIG_AF.coefPVHC
  stats.AF.PVstage = stats.AF.HcsStage * CONFIG_AF.coefPVHC
  stats.AF.PV = Math.max(stats.AF.PVrm, stats.AF.PVgm) + stats.AF.PVstage
  // stats.AF.sHCr = stats.AF.PV / CONFIG_AF.coefPVHC
  // stats.AF.HCr = Math.max(stats.AF.sHCr, stats.AF.HCgm) + stats.AF.HcsStage

  stats.AF.PVNuit = stats.AF.TSVnuit * CONFIG_AF.coefMajoNuit // en PVEI (xKSP pour LC PEQ2)
  stats.AF.PVCDB = stats.countVol * CONFIG_AF.coefPVCDB

  stats.TO.eHS = stats.TO.HCrm - stats.TO.seuilHS
  stats.AF.eHS = stats.AF.HC - stats.AF.seuilHS

  stats.TO.HS = Math.max(0, stats.TO.eHS)
  stats.AF.HS = Math.max(0, stats.AF.eHS)

  console.log('RemuPNT.remuMois', month.toISODate(), stats)

  return stats
}

function filterDaysByDates(days, debut, fin) {
  const dateDebut = debut.toISODate()
  const dateFin = fin.toISODate()
  return _.filter(days, day => (day.date >= dateDebut && day.date <= dateFin))
}

function isDemiJournée(jourSol, splitHour = 12) {
  if (_.some(jourSol.events, evt => /CEMPN/i.test(evt.summary))) return false
  if (duree(jourSol.debut, jourSol.fin) > 4) return false

  const mijournée = jourSol.debut.set({ hour: splitHour, minute: 0 })
  if (jourSol.debut >= mijournée || jourSol.fin <= mijournée) return true

  return false
}

function exportRemuData(remu) {
  return _.chain(remu)
    .omitBy(DateTime.isDateTime)
    .mapValues((value, key) => {
      if (value instanceof Big || typeof value === 'number') {
        return value.toFixed(2)
      }
      if (key === 'split') {
        return _.mapValues(value, split => exportRemuData(split))
      }
      return value
    })
    .value()
}