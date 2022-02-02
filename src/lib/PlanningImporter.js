import * as Comlink from 'comlink'
import * as pdfjsLib from 'pdfjs-dist/webpack'
import { groupPdfPageTables } from './groupPdfPageTables.js'
// eslint-disable-next-line import/no-webpack-loader-syntax
import PdfImportWorker from 'worker-loader!./PdfImportWorker.js'
import { useEventsDatasource } from './useEventsDatasource.js'

export async function importPdfFile(data) {
  const { parsePageContent, importPdfPlanning } = Comlink.wrap(new PdfImportWorker())
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
