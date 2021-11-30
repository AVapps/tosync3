import { CrewWebPlus } from '@/lib/CrewWebPlus'

let crewWeb

export const useCrewWebPlus = () => {
  if (!crewWeb) {
    crewWeb = new CrewWebPlus()
  }
  return crewWeb
}
