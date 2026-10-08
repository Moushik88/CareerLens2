import type { ScoreWeights } from './types'

const KEY = 'careerlens:score-weights'

export const DEFAULT_WEIGHTS: ScoreWeights = {
  evidence: 30,
  projects: 25,
  roleFit: 20,
  activity: 15,
  profile: 10,
}

export function normalizeWeights(input: Partial<ScoreWeights>): ScoreWeights {
  const merged: ScoreWeights = {
    evidence: clampWeight(input.evidence ?? DEFAULT_WEIGHTS.evidence),
    projects: clampWeight(input.projects ?? DEFAULT_WEIGHTS.projects),
    roleFit: clampWeight(input.roleFit ?? DEFAULT_WEIGHTS.roleFit),
    activity: clampWeight(input.activity ?? DEFAULT_WEIGHTS.activity),
    profile: clampWeight(input.profile ?? DEFAULT_WEIGHTS.profile),
  }
  const total =
    merged.evidence + merged.projects + merged.roleFit + merged.activity + merged.profile
  if (total <= 0) return { ...DEFAULT_WEIGHTS }
  // Keep relative proportions but expose as percentages that sum to 100
  return {
    evidence: Math.round((merged.evidence / total) * 100),
    projects: Math.round((merged.projects / total) * 100),
    roleFit: Math.round((merged.roleFit / total) * 100),
    activity: Math.round((merged.activity / total) * 100),
    profile: Math.round((merged.profile / total) * 100),
  }
}

function clampWeight(n: number) {
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(100, Math.round(n))
}

export function loadWeights(): ScoreWeights {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_WEIGHTS }
    return normalizeWeights(JSON.parse(raw) as Partial<ScoreWeights>)
  } catch {
    return { ...DEFAULT_WEIGHTS }
  }
}

export function saveWeights(weights: ScoreWeights) {
  const normalized = normalizeWeights(weights)
  // Fix rounding drift so sum is exactly 100
  const sum =
    normalized.evidence +
    normalized.projects +
    normalized.roleFit +
    normalized.activity +
    normalized.profile
  if (sum !== 100) {
    normalized.evidence += 100 - sum
  }
  localStorage.setItem(KEY, JSON.stringify(normalized))
  return normalized
}

export function resetWeights() {
  localStorage.removeItem(KEY)
  return { ...DEFAULT_WEIGHTS }
}

export function weightFraction(weights: ScoreWeights, key: keyof ScoreWeights) {
  const total =
    weights.evidence + weights.projects + weights.roleFit + weights.activity + weights.profile
  return total === 0 ? 0 : weights[key] / total
}
