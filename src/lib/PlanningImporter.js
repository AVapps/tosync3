import * as Comlink from 'comlink'
import pdfjsLib from './PdfPlanning/pdfjs.js'
import { groupPdfPageTables } from './PdfPlanning/groupPdfPageTables.js'
import { useEventsDatasource } from './useEventsDatasource.js'

export async function importPdfFile(data) {
  const worker = new Worker(new URL('./PdfPlanning/PdfImportWorker.js', import.meta.url))
  const { parsePageContent, importPdfPlanning } = Comlink.wrap(worker)
  const doc = await pdfjsLib.getDocument(data).promise
  const numPages = doc.numPages
  const pageTables = []
  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i)
    const opList = await page.getOperatorList()
    const textContent = await page.getTextContent()
    pageTables.push(await parsePageContent(opList, textContent))
  }
  doc.destroy()
  const pdf = groupPdfPageTables(pageTables)
  console.log('PDF', pdf)
  const updateLog = await importPdfPlanning(pdf)
  console.log('importPdfFile.updateLog', updateLog)
  const datasourceClient = useEventsDatasource()
  return datasourceClient.bulkUpdate(updateLog)
}
