import { forEach } from 'lodash'

const TITLES = {
  sol: 'Participants',
  mep: 'MEP',
  pnt: 'Pilotes',
  pnc: 'PNC'
}

export default function (peq) {
  let str = ''
  forEach(peq, (list, key) => {
    if (list.length) {
      str += `${TITLES[key]} :\n`
      forEach(list, (code) => {
        str += `${code}\n`
      })
    }
  })
  return str
}
