import type { AnalysisResult, ProgressSnapshot } from './types'

const KEY = 'careerlens:progress-history'
const MAX = 24

export function appendProgress(result: AnalysisResult) {
  const snapshot: ProgressSnapshot = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    candidateName: result.candidateName,
    targetRoleTitle: result.targetRoleTitle,
    readinessScore: result.readinessScore,
    activityConsistencyScore: result.activityConsistencyScore,
    verifiedCount: result.skills.filter((s) => s.status === 'verified').length,
    gapCount: result.gapItems.length,
    analyzedAt: result.analyzedAt,
  }
  const prev = loadProgress()
  const next = [snapshot, ...prev].slice(0, MAX)
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function loadProgress(): ProgressSnapshot[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as ProgressSnapshot[]
  } catch {
    return []
  }
}

export function clearProgress() {
  localStorage.removeItem(KEY)
}
