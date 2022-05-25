import { duree } from './helpers'
import { toLocaleString } from '@/helpers/dates'
import { DateTime } from 'luxon'
import peq from './peq'
import instruction from './instruction'

export default function (evt) {
  let str = ''
  if (evt.remark) {
    str += `${evt.remark}\n\n`
  }

  str += `Départ : ${evt.from} ${toLocaleString(evt.start, DateTime.DATETIME_FULL)}\nArrivée : ${evt.to} ${toLocaleString(evt.end, DateTime.DATETIME_FULL)}\nTemps de vol : ${duree(evt)}\nImmat : ${evt.immat}\nFonction : ${evt.fonction}`

  if (evt.peq) {
    str += `\n\n${peq(evt.peq)}`
  }

  if (evt.instruction) {
    str += `\n\nInstruction\n${instruction(evt.instruction)}`
  }

  return str
}
