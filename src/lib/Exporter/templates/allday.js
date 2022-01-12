import { tsToDateString } from './helpers'

export default function (evt) {
  let str = `${evt.summary} [${evt.category}]`

  if (evt.remark) {
    str += `\n\n${evt.remark}`
  }
  return str
}
