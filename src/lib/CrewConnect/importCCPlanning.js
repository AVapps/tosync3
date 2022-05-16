import { wrap } from 'comlink'

export async function importCrewConnectPlanning(rosterCalendars) {
  const worker = new Worker(new URL('./CCImportWorker.js', import.meta.url))
  const { importCrewConnectData } = wrap(worker)
  const updateLog = await importCrewConnectData(rosterCalendars)
  console.log('importCrewConnectPlanning', updateLog)
  return updateLog
}