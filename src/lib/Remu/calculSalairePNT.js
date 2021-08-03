import _ from 'lodash'

import BAREME_AF from '@/data/bareme-af.json'
import BAREME_TO from '@/data/bareme-to.json'

const PROFIL_DEFAULTS = {
  anciennete: 0,
  echelon: 1,
  fonction: 'OPL',
  categorie: 'A',
  grille: 'OPLA',
  atpl: false,
  classe: 5
}

export function calculSalaireAF(stats, profil = {}) {
  _.defaults(profil, PROFIL_DEFAULTS)

  const coefClasse = (_.get(BAREME_AF.classes, [profil.fonction, profil.classe].join('.')) + ((profil.fonction !== 'CDB' && profil.atpl) ? BAREME_AF.bonificationATPL : 0)) * _.get(BAREME_AF.coefCategorie, profil.categorie)

  const remu = {
    fixe: BAREME_AF.fixeCDBA1 * _.get(BAREME_AF.coefEchelon, profil.echelon) * (profil.fonction !== 'CDB' ? BAREME_AF.coefFixeOPL : 1),
    PVEI: BAREME_AF.THB * coefClasse,
    coefClasse
  }

  const PVMGA100 = BAREME_AF.PVMGA * remu.PVEI
  const MGA100 = remu.fixe + PVMGA100
  const taux30eMGA = MGA100 / 30
  const PVMGA = stats.AF.trentiemes * BAREME_AF.PVMGA / 30
  const PVCDB = (profil.fonction === 'CDB') ? stats.AF.PVCDB : 0
  const totalPV = stats.AF.PV + stats.AF.PVNuit + PVCDB
  const nbPVcomp = Math.max(totalPV - PVMGA, 0)

  const tauxHSTF = 1.25 * remu.fixe / 75
  const tauxHSPV = remu.PVEI * 0.25 * totalPV / stats.AF.HC

  _.extend(remu, {
    PVMGA100,
    PVMGA,
    tauxMGA: taux30eMGA,
    deductionAbsence: (-stats.AF.NJabs) * taux30eMGA,
    maladie: stats.count.maladie * taux30eMGA,
    PVCDB,
    totalPV,
    nbPVcomp,
    montantPVcomp: nbPVcomp * remu.PVEI,
    tauxHSTF,
    montantHSTF: tauxHSTF * stats.AF.HS,
    tauxHSPV,
    montantHSPV: tauxHSPV * stats.AF.HS
  })

  const totalBrutHorsConges = MGA100 + remu.deductionAbsence + remu.maladie + remu.montantPVcomp + remu.montantHSTF + remu.montantHSPV

  const tauxConges = (totalBrutHorsConges / (30 - stats.count.conges)) * 30 / 28
  const montantConges = stats.count.conges * tauxConges

  _.extend(remu, {
    tauxConges,
    montantConges,
    totalBrut: totalBrutHorsConges + montantConges
  })

  console.log('RemuPNT.salaireAF', remu)

  return remu
}

export function calculSalaireTO(stats, profil = {}) {
  _.defaults(profil, PROFIL_DEFAULTS)

  const salaire = {
    fixe: _.get(BAREME_TO, [profil.grille, profil.anciennete, 0].join('.')),
    PV: _.get(BAREME_TO, [profil.grille, profil.anciennete, 1].join('.')),
    PV75HC: _.get(BAREME_TO, [profil.grille, profil.anciennete, 2].join('.')),
    SMMG: _.get(BAREME_TO, [profil.grille, profil.anciennete, 3].join('.'))
  }

  const pvSMMGTO = stats.TO.trentiemes * BAREME_TO.PVSMMG / 30
  const nbPVCompTO = stats.TO.HCrm > pvSMMGTO ? Math.min(stats.TO.HCrm - pvSMMGTO, stats.TO.seuilHS - pvSMMGTO) : 0
  const tauxHSTO = (1.25 * salaire.PV75HC) + (1.25 * salaire.fixe) / 75
  const taux30eSMMGTO = salaire.SMMG / 30

  _.extend(salaire, {
    PVSMMG: pvSMMGTO,
    tauxSMMG: taux30eSMMGTO,
    retraitTrentiemes: (-stats.TO.NJabs) * taux30eSMMGTO,
    maladie: stats.count.maladie * taux30eSMMGTO,
    stage: stats.TO.NJstage * taux30eSMMGTO,
    nbPVcomp: nbPVCompTO,
    PVcomp: nbPVCompTO * salaire.PV,
    tauxHS: tauxHSTO,
    HS: stats.TO.HS * tauxHSTO
  })

  const brutHorsCongesTO = salaire.SMMG + salaire.retraitTrentiemes + salaire.maladie + salaire.stage + salaire.PVcomp + salaire.HS
  const tauxCongesTO = brutHorsCongesTO / (30 - stats.count.conges)

  _.extend(salaire, {
    tauxConges: tauxCongesTO,
    conges: stats.count.conges * tauxCongesTO,
    brut: brutHorsCongesTO + stats.count.conges * tauxCongesTO
  })

  console.log('RemuPNT.salaireTO', salaire)

  return salaire
}
