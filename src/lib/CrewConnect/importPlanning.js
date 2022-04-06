import { wrap } from 'comlink'

export async function importCrewConnectPlanning(data) {
  const worker = new Worker(new URL('./CCImportWorker.js', import.meta.url))
  const { importCrewConnectData } = wrap(worker)
  const updateLog = await importCrewConnectData(data)
  console.log('importCrewConnectPlanning', updateLog)
  return updateLog
}