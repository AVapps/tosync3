import { useCrews } from '@/store'

export default function (peq) {
  const crewsStore = useCrews()
  return peq
    .map(({ crewCode, fct, cpt }) => {
      const pn = crewsStore.get(crewCode)
      if (pn) {
        return `${cpt ? '© ': ''}${fct} - ${pn.lastName} ${pn.firstName} (${crewCode}) [${pn.contractRoles}]`
      } else {
        return `${cpt ? '© ': ''}${fct} - ${crewCode}`
      }
    })
    .join('\n')
}
