import * as Comlink from 'comlink'
import * as pdfjsLib from 'pdfjs-dist/webpack'
import { groupPdfPageTables } from './groupPdfPageTables.js'
import PdfImportWorker from "worker-loader!./PdfImportWorker.js"

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
  const result = await importPdfPlanning(pdf)
  return result
}