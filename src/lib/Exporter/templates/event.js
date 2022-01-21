import peq from './peq'
import instruction from './instruction'

export default function (evt) {
  let str = `${evt.summary} [${evt.category}]`

  if (evt.remark) {
    str += `\n\n${evt.remark}`
  }

  if (evt.peq) {
    str += `\n\n${peq(evt.peq)}`
  }

  if (evt.instruction) {
    str += `\n\nInstruction\n${instruction(evt.instruction)}`
  }

  return str
}
