import * as pdfjs from 'pdfjs-dist'

if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjs.GlobalWorkerOptions.workerPort = new Worker(new URL('pdfjs-dist/build/pdf.worker.js', import.meta.url))
}

export default pdfjs
