import type { RoleId } from '../data/roles'

export type EvidenceSource =
  | 'resume'
  | 'github'
  | 'portfolio'
  | 'linkedin'
  | 'behance'
  | 'figma'
  | 'dribbble'
  | 'leetcode'
  | 'kaggle'
  | 'hackerrank'
  | 'certificate'

export type SkillStatus = 'verified' | 'partial' | 'unverified' | 'missing'

export interface ProfileLinks {
  github: string
  linkedin: string
  portfolio: string
  behance: string
  figma: string
  dribbble: string
  leetcode: string
  kaggle: string
  hackerrank: string
  certificates: string
}

export interface ScoreWeights {
  evidence: number
  projects: number
  roleFit: number
  activity: number
  profile: number
}

export interface CandidateInput {
  name: string
  email?: string
  targetRoleId: RoleId
  resumeText: string
  resumeFileName?: string
  links: ProfileLinks
  /** Manual LinkedIn export / public profile notes */
  linkedinDetails?: string
}

export interface SkillEvidence {
  skill: string
  claimed: boolean
  verified: boolean
  status: SkillStatus
  score: number
  evidenceCount: number
  sources: EvidenceSource[]
  proofNotes: string[]
  strength: 'strong' | 'moderate' | 'weak' | 'missing'
}

export interface SkillGap {
  skill: string
  priority: 'high' | 'medium' | 'low'
  reason: string
}

export interface ScoreBreakdown {
  evidence: number
  projects: number
  roleFit: number
  activity: number
  profile: number
  evidenceMatch: number
  projectDepth: number
  roleAlignment: number
  consistency: number
  professionalPresence: number
}

export interface RoleFit {
  roleId: RoleId
  title: string
  domain: string
  fitScore: number
  matched: string[]
  missing: string[]
  rationale: string
}

export interface RoadmapStep {
  week: string
  title: string
  why: string
  actions: string[]
  courses: string[]
  milestone: string
}

export interface FeedbackItem {
  area: 'resume' | 'portfolio' | 'github' | 'linkedin' | 'profile'
  severity: 'strength' | 'improve' | 'critical'
  title: string
  detail: string
  rewriteSuggestion?: string
}

export interface AnalysisResult {
  candidateName: string
  targetRoleId: RoleId
  targetRoleTitle: string
  readinessScore: number
  readinessLabel: string
  activityConsistencyScore: number
  tagline: string
  summary: string
  breakdown: ScoreBreakdown
  weightsUsed: ScoreWeights
  explanations: string[]
  skills: SkillEvidence[]
  verifiedStrengths: string[]
  gaps: SkillEvidence[]
  gapItems: SkillGap[]
  roleFits: RoleFit[]
  roadmap: RoadmapStep[]
  feedback: FeedbackItem[]
  radar: { label: string; value: number }[]
  sourcesUsed: EvidenceSource[]
  projectsDetected: string[]
  githubStats?: {
    publicRepos: number
    followers: number
    languages: string[]
    recentActivityScore: number
    stars: number
  }
  analyzedAt: string
}

export interface ProgressSnapshot {
  id: string
  candidateName: string
  targetRoleTitle: string
  readinessScore: number
  activityConsistencyScore: number
  verifiedCount: number
  gapCount: number
  analyzedAt: string
}

export interface BatchStudent {
  id: string
  name: string
  branch: string
  targetRole: string
  readinessScore: number
  roleFit: number
  topGap: string
  skills: string[]
  verifiedSkills: number
  claimedSkills: number
  trend: 'up' | 'down' | 'flat'
}
