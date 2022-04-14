import { PouchDBCollection } from './PouchDBCollection.js'
import { crewSchema } from './crews'
import { isMatch } from 'lodash'

export class CrewsCollection extends PouchDBCollection {
  constructor() {
    super('CrewsIndex', { idFunction: ['crewCode'] })
  }

  async getAll() {
    const { rows } = await this.collection.allDocs({ include_docs: true })
    return rows.map(row => row.doc)
  }

  async importList(crews, { overwriteTitles = false }) {
    const currentCrews = await this.getAll()
    const dbMap = new Map()
    currentCrews.forEach(crew => dbMap.set(crew._id, crew))

    const updateLog = { inserted: [], updated: [], removed: [] }
    const bulkOps = []
    
    crews.forEach(crew => {
      crew._id = crew.crewCode
      crew = crewSchema.clean(crew)
      if (dbMap.has(crew._id)) {
        const dbCrew = dbMap.get(crew._id)
        if (!overwriteTitles) {
          crew.title = dbCrew.title
        }
        if (!isMatch(dbCrew, crew)) {
          crew._rev = dbCrew._rev
          updateLog.updated.push(crew)
          bulkOps.push(crew)
        }
      } else {
        updateLog.inserted.push(crew)
        bulkOps.push(crew)
      }
    })

    if (bulkOps.length) {
      const result = await this.collection.bulkDocs(bulkOps)
      console.log('CrewsIndex.importList', result, updateLog)
      return { ...updateLog, result }
    }

    return updateLog
  }
}