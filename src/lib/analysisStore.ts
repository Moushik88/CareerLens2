import { appendProgress } from './progressStore'
import type { AnalysisResult } from './types'

const KEY = 'careerlens:last-analysis'

export function saveAnalysis(result: AnalysisResult) {
  localStorage.setItem(KEY, JSON.stringify(result))
  appendProgress(result)
}

export function loadAnalysis(): AnalysisResult | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as AnalysisResult
  } catch {
    return null
  }
}
