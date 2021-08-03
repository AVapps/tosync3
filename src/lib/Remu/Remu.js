// import { } from './RemuPNC'
import { remuJourSol, remuMois, remuRotation, remuSimuAF, remuSimuInstAF } from './RemuPNT'

export function remuForEvent(evt, isPNT = false) {
  if (isPNT) {
    switch (evt.tag) {
      case 'rotation':
        return remuRotation(evt)
      case 'simu':
        return remuSimuAF(evt)
      case 'instructionSimu':
        return remuSimuInstAF(evt)
    }
  }
}

export function remuForDay(day, isPNT = false) {
  if (isPNT) {
    return remuJourSol(day)
  }
}

export function remuForMonth(month, events, days, isPNT = false) {
  if (isPNT) {
    return remuMois(month, events, days)
  }
}

export function calculSalaire(month, isPNT = false) {

}
