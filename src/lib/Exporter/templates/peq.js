import { forEach, has } from 'lodash'
import PN from '@/model/PN.js'

function crewTemplate(pn, isMEP) {
  const name = has(pn, 'firstName') && has(pn, 'lastName') ? `${pn.lastName} ${pn.firstName}` : pn.name
  const fonction = isMEP ? 'MEP' : pn.title + (pn.cpt ? '*' : '')
  let str = `${fonction} - ${name} (${pn.crewCode})`
  if (has(pn, 'contractRoles')) {
    str += ` [${pn.contractRoles}]`
  }
  return str
}

export default function (peq) {
  const crews = []
  forEach(peq, (list, key) => {
    if (list.length) {
      const listePN = PN.mapCrew(list)
      crews.push(listePN.map(pn => crewTemplate(pn, key === 'mep')).join('\n'))
    }
  })
  return crews.join('\n\n')
}
