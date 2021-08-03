import * as Comlink from 'comlink'
import { EventsDatasource } from './EventsDatasource'
import { DateTime } from 'luxon'

self.DateTime = DateTime

const datasource = new EventsDatasource()
datasource.watchDb()

self.Events = datasource.db
self.datasource = datasource

Comlink.expose(datasource)
