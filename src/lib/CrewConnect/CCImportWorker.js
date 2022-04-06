import * as Comlink from 'comlink'

import { CrewConnectPlanningParser } from './CCPlanningParser.js'
import { CrewConnectPlanningImporter } from './CCPlanningImporter.js'

async function importCrewConnectData(data) {
  const planningParser = new CrewConnectPlanningParser()
  const result = planningParser.parse(data)
  console.log('importCrewConnectData.planningParser', planningParser, result)
  const planningImporter = new CrewConnectPlanningImporter()
  return planningImporter.importPlanning(result)
}

Comlink.expose({ importCrewConnectData })