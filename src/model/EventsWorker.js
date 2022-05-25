import * as Comlink from 'comlink'
import { PlanningDatasource } from './PlanningDatasource'
import { CrewConnectPlanningParser } from '@/lib/CrewConnect/CCPlanningParser.js'
import { CrewConnectPlanningImporter } from '@/lib/CrewConnect/CCPlanningImporter.js'

const datasource = new PlanningDatasource()
datasource.watchDb()

async function importCrewConnectData({ localCalendar, crewCode, rosterState }) {
  const planningParser = new CrewConnectPlanningParser()
  const { planning, userId, profile, requestDate, crews } = planningParser.parse({ localCalendar, crewCode, rosterState })
  console.log('importCrewConnectData.planningParser', planningParser, planning, userId, profile, requestDate, crews)
  const planningImporter = new CrewConnectPlanningImporter()
  const updateLog = await planningImporter.importPlanning({ planning, userId, profile, requestDate })
  console.log('importCrewConnectData.planningImporter.updateLog', updateLog)
  const updateResult = await datasource.bulkUpdate(updateLog)
  const results = updateResult.docs.map((doc, index) => {
    const result = updateResult.result[ index ]
    const r = {
      _id: doc._id,
      success: !!result.ok
    }
    if (result.error) {
      r.error = result
    }
    return r
  })
  console.log('importCrewConnectData.result', updateResult)
  return {
    userId,
    profile,
    crews,
    results,
    success: results.every(r => r.success)
  }
}

Comlink.expose({ datasource, importCrewConnectData })
