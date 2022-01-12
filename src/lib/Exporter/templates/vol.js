import { tsToDateTimeString, duree } from './helpers'
import peq from './peq'
import instruction from './instruction'

export default function (evt) {
  let str = ''
  if (evt.remark) {
    str += `${evt.remark}\n\n`
  }

  str += `Départ : ${evt.from} ${tsToDateTimeString(evt.start)}\nArrivée : ${evt.to} ${tsToDateTimeString(evt.end)}\nTemps de vol : ${duree(evt)}\nImmat : ${evt.immat}\nFonction : ${evt.fonction}`

  if (evt.peq) {
    str += `\n\nEQUIPAGE\n${peq(evt.peq)}`
  }

  if (evt.instruction) {
    str += `\n\nINSTRUCTION\n${instruction(evt.instruction)}`
  }

  return str
}
