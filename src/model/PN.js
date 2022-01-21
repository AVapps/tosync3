import Crews from '@/data/crews.json'

class CrewIndex {
  constructor(crews) {
    this.crews = crews
    this.crewMap = new Map(crews.map(crew => [crew.crewCode, crew]))
  }

  find(crewCode) {
    return this.crewMap.get(crewCode)
  }

  mapCrew(crewList) {
    return crewList.map(crew => {
      if (typeof crew === 'string') {
        return this.find(crew) || { crewCode: crew }
      } else if (typeof crew === 'object' && crew?.crewCode) {
        const found = this.find(crew.crewCode)
        return found ? { ...crew, ...found } : crew
      }
      return { crewCode: crew }
    })
  }
}

const PN = new CrewIndex(Crews)
export default PN
