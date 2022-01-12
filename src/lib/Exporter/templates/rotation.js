import { tsToDateTimeString } from './helpers'

export default function (evt) {
  return `Début : ${tsToDateTimeString(evt.start)}\nFin : ${tsToDateTimeString(evt.end)}`
}
