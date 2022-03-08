import * as Comlink from 'comlink'
import { PlanningDatasource } from './PlanningDatasource' 
import { DateTime } from 'luxon'

const datasource = new PlanningDatasource()
datasource.watchDb()

Comlink.expose(datasource)
