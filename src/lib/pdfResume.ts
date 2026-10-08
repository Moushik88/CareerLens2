import * as pdfjs from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

export interface ResumeParseResult {
  text: string
  method: 'text' | 'ocr' | 'hybrid'
  pageCount: number
  warning?: string
}

function looksLikeGarbage(text: string): boolean {
  const letters = (text.match(/[a-zA-Z]/g) ?? []).length
  const words = text.trim().split(/\s+/).filter((w) => w.length > 2)
  return letters < 80 || words.length < 25
}

async function extractEmbeddedText(data: ArrayBuffer): Promise<{
  text: string
  pageCount: number
}> {
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const line = content.items
      .map((item) => ('str' in item ? String((item as { str: string }).str) : ''))
      .join(' ')
    pages.push(line)
  }

  return { text: pages.join('\n\n').replace(/\s+\n/g, '\n').trim(), pageCount: pdf.numPages }
}

async function renderPageToCanvas(
  data: ArrayBuffer,
  pageNumber: number,
  scale = 2,
): Promise<HTMLCanvasElement> {
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported in this browser')

  canvas.width = viewport.width
  canvas.height = viewport.height
  await page.render({ canvas, canvasContext: ctx, viewport }).promise
  return canvas
}

async function ocrPdf(data: ArrayBuffer, pageCount: number): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng')
  const maxPages = Math.min(pageCount, 4)
  const chunks: string[] = []

  try {
    for (let i = 1; i <= maxPages; i++) {
      const canvas = await renderPageToCanvas(data, i, 2.2)
      const {
        data: { text },
      } = await worker.recognize(canvas)
      chunks.push(text)
    }
  } finally {
    await worker.terminate()
  }

  return chunks.join('\n\n').trim()
}

/** Parse a resume PDF — uses embedded text first, OCR for scanned pages. */
export async function parseResumePdf(
  file: File,
  onProgress?: (message: string) => void,
): Promise<ResumeParseResult> {
  const data = await file.arrayBuffer()
  onProgress?.('Reading PDF text layer…')
  const embedded = await extractEmbeddedText(data)

  if (!looksLikeGarbage(embedded.text)) {
    return {
      text: embedded.text,
      method: 'text',
      pageCount: embedded.pageCount,
    }
  }

  onProgress?.(
    'Scanned PDF detected — running OCR (first pages). This can take 20–60s…',
  )
  const ocrText = await ocrPdf(data, embedded.pageCount || 1)

  if (looksLikeGarbage(ocrText) && looksLikeGarbage(embedded.text)) {
    return {
      text: ocrText || embedded.text,
      method: 'ocr',
      pageCount: embedded.pageCount,
      warning:
        'OCR found very little readable text. Try a clearer scan or paste the resume text.',
    }
  }

  if (!looksLikeGarbage(ocrText) && !looksLikeGarbage(embedded.text)) {
    return {
      text: `${embedded.text}\n\n${ocrText}`,
      method: 'hybrid',
      pageCount: embedded.pageCount,
    }
  }

  return {
    text: ocrText || embedded.text,
    method: 'ocr',
    pageCount: embedded.pageCount,
  }
}

async function parseDocx(
  file: File,
  onProgress?: (message: string) => void,
): Promise<ResumeParseResult> {
  onProgress?.('Reading DOCX…')
  const mammoth = await import('mammoth')
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  const text = (result.value || '').trim()
  return {
    text,
    method: 'text',
    pageCount: 1,
    warning: text.length < 40 ? 'DOCX contained very little text.' : undefined,
  }
}

export async function readResumeFile(
  file: File,
  onProgress?: (message: string) => void,
): Promise<ResumeParseResult> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    return parseResumePdf(file, onProgress)
  }
  if (
    name.endsWith('.docx') ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return parseDocx(file, onProgress)
  }

  onProgress?.('Reading text file…')
  const text = await file.text()
  return { text, method: 'text', pageCount: 1 }
}
