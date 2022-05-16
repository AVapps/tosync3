import * as Comlink from 'comlink'

import { CrewConnectPlanningParser } from './CCPlanningParser.js'
import { CrewConnectPlanningImporter } from './CCPlanningImporter.js'

async function importCrewConnectData(data) {
  const planningParser = new CrewConnectPlanningParser()
  const { planning, userId, profile, requestDate, crews } = planningParser.parse(data)
  console.log('importCrewConnectData.planningParser', planningParser, planning, userId, profile, requestDate, crews)
  const planningImporter = new CrewConnectPlanningImporter()
  const updateLog = await planningImporter.importPlanning({ planning, userId, profile, requestDate })
  return {
    userId,
    profile,
    crews,
    ...updateLog
  }
}

Comlink.expose({ importCrewConnectData })