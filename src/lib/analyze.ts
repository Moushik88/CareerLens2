import type { RoleId } from '../data/roles'
import {
  detectSourcesFromLinks,
  extractLinkedinSignals,
  extractProjects,
  extractSkillsFromText,
  normalizeSkill,
  parseGithubUsername,
} from './extract'
import { buildFeedback } from './feedback'
import { fetchGithubSignals, type GithubProfileSignal } from './github'
import { getConfiguredRoles } from './roleConfig'
import type {
  AnalysisResult,
  CandidateInput,
  EvidenceSource,
  RoadmapStep,
  RoleFit,
  ScoreBreakdown,
  ScoreWeights,
  SkillEvidence,
  SkillGap,
  SkillStatus,
} from './types'
import { loadWeights, weightFraction } from './weights'

function unique(skills: string[]): string[] {
  return [...new Set(skills.map(normalizeSkill).filter(Boolean))]
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)))
}

function readinessLabel(score: number): string {
  if (score >= 85) return 'Interview Ready'
  if (score >= 70) return 'Strong Contender'
  if (score >= 55) return 'Near Ready'
  if (score >= 40) return 'Building Momentum'
  return 'Foundation Stage'
}

/** Deterministic evidence → skill score (strategy MVP). */
function evidenceToScore(count: number): number {
  if (count <= 0) return 0
  if (count === 1) return 30
  if (count === 2) return 50
  if (count <= 4) return 70
  return 90
}

function statusFrom(claimed: boolean, score: number, evidenceCount: number): SkillStatus {
  if (evidenceCount >= 3 && score >= 70) return 'verified'
  if (evidenceCount >= 1 && score >= 40) return 'partial'
  if (claimed) return 'unverified'
  return 'missing'
}

function strengthFrom(status: SkillStatus): SkillEvidence['strength'] {
  if (status === 'verified') return 'strong'
  if (status === 'partial') return 'moderate'
  if (status === 'unverified') return 'weak'
  return 'missing'
}

function addProof(
  map: Map<string, { sources: EvidenceSource[]; notes: string[]; count: number }>,
  skill: string,
  source: EvidenceSource,
  note: string,
  weight = 1,
) {
  const key = normalizeSkill(skill)
  const current = map.get(key) ?? { sources: [], notes: [], count: 0 }
  if (!current.sources.includes(source)) current.sources.push(source)
  if (!current.notes.includes(note)) current.notes.push(note)
  current.count += weight
  map.set(key, current)
}

function buildSkills(
  claimed: string[],
  proofMap: Map<string, { sources: EvidenceSource[]; notes: string[]; count: number }>,
  roleSkills: string[],
  github?: GithubProfileSignal | null,
): SkillEvidence[] {
  const all = unique([...claimed, ...proofMap.keys(), ...roleSkills])

  return all
    .map((skill) => {
      const isClaimed = claimed.includes(skill)
      const proof = proofMap.get(skill)
      let evidenceCount = proof?.count ?? 0

      const ghHits = github?.skillRepoHits?.[skill] ?? 0
      if (ghHits > 0) {
        evidenceCount = Math.max(evidenceCount, ghHits)
      }

      let score = evidenceToScore(evidenceCount)

      if (isClaimed && evidenceCount === 0) score = 20
      if (github?.languages.includes(skill)) score = clamp(score + 8)
      if ((proof?.sources.length ?? 0) >= 2) score = clamp(score + 6)

      const status = statusFrom(isClaimed, score, evidenceCount)
      const sources = proof?.sources ?? []
      const notes = [...(proof?.notes ?? [])]
      if (ghHits > 0 && !notes.some((n) => n.includes('GitHub'))) {
        notes.unshift(`${ghHits} related GitHub repositories/projects detected`)
      }

      return {
        skill,
        claimed: isClaimed,
        verified: status === 'verified' || status === 'partial',
        status,
        score: clamp(score),
        evidenceCount,
        sources,
        proofNotes: notes,
        strength: strengthFrom(status),
      }
    })
    .sort((a, b) => b.score - a.score || a.skill.localeCompare(b.skill))
}

function computeBreakdown(
  skills: SkillEvidence[],
  mustHave: string[],
  projects: string[],
  sources: EvidenceSource[],
  github?: GithubProfileSignal | null,
): ScoreBreakdown {
  const roleSkills = skills.filter((s) => mustHave.includes(s.skill))
  const avgEvidence =
    roleSkills.length === 0
      ? 0
      : roleSkills.reduce((sum, s) => sum + s.score, 0) / roleSkills.length

  const evidence = clamp(avgEvidence)

  const substantial = projects.length
  const projectQuality =
    Math.min(substantial, 4) * 15 +
    (github ? Math.min(github.readmeQualityHits, 4) * 5 : 0) +
    (github ? Math.min(github.stars, 20) : 0) +
    (sources.includes('portfolio') || sources.includes('behance') || sources.includes('figma')
      ? 10
      : 0)
  const projectsScore = clamp(projectQuality)

  const matched = roleSkills.filter(
    (s) => s.status === 'verified' || s.status === 'partial',
  ).length
  const roleFit = clamp((matched / Math.max(mustHave.length, 1)) * 100)

  let activityBase =
    github?.recentActivityScore ??
    (sources.includes('github') ? 45 : 28) + Math.min(projects.length, 3) * 8
  if (sources.includes('leetcode') || sources.includes('hackerrank')) activityBase += 8
  if (sources.includes('kaggle')) activityBase += 8
  if (sources.includes('certificate') || sources.includes('linkedin')) activityBase += 6
  const activity = clamp(activityBase)

  const profile = clamp(
    Math.min(sources.length, 6) * 12 +
      (sources.includes('github') ? 10 : 0) +
      (sources.includes('linkedin') || sources.includes('portfolio') ? 10 : 0) +
      (sources.includes('behance') || sources.includes('figma') || sources.includes('dribbble')
        ? 8
        : 0),
  )

  return {
    evidence,
    projects: projectsScore,
    roleFit,
    activity,
    profile,
    evidenceMatch: evidence,
    projectDepth: projectsScore,
    roleAlignment: roleFit,
    consistency: activity,
    professionalPresence: profile,
  }
}

function overallScore(b: ScoreBreakdown, weights: ScoreWeights): number {
  return clamp(
    b.evidence * weightFraction(weights, 'evidence') +
      b.projects * weightFraction(weights, 'projects') +
      b.roleFit * weightFraction(weights, 'roleFit') +
      b.activity * weightFraction(weights, 'activity') +
      b.profile * weightFraction(weights, 'profile'),
  )
}

function roleFits(skills: SkillEvidence[], preferred: RoleId): RoleFit[] {
  const roles = getConfiguredRoles()
  const verified = skills
    .filter((s) => s.status === 'verified' || s.status === 'partial')
    .map((s) => s.skill)

  return roles
    .map((role) => {
      const matched = role.mustHave.filter((s) => verified.includes(s))
      const soft = role.niceToHave.filter((s) =>
        skills.some((x) => x.skill === s && x.score >= 40),
      )
      const missing = role.mustHave.filter((s) => !verified.includes(s))
      const fitScore = clamp(
        (matched.length / Math.max(role.mustHave.length, 1)) * 75 +
          (soft.length / Math.max(role.niceToHave.length, 1)) * 25 +
          (role.id === preferred ? 3 : 0),
      )

      return {
        roleId: role.id,
        title: role.title,
        domain: role.domain,
        fitScore,
        matched,
        missing,
        rationale:
          missing.length === 0
            ? `Evidence supports most must-have skills for ${role.title}.`
            : `Missing verified proof for ${missing.slice(0, 3).join(', ')}${
                missing.length > 3 ? ` (+${missing.length - 3} more)` : ''
              }.`,
      }
    })
    .sort((a, b) => b.fitScore - a.fitScore)
}

function buildGaps(skills: SkillEvidence[], mustHave: string[]): SkillGap[] {
  const rank = { high: 0, medium: 1, low: 2 } as const
  return skills
    .filter(
      (s) =>
        mustHave.includes(s.skill) &&
        (s.status === 'unverified' || s.status === 'missing' || s.status === 'partial'),
    )
    .map((s) => ({
      skill: s.skill,
      priority:
        s.status === 'unverified' || s.status === 'missing'
          ? ('high' as const)
          : ('medium' as const),
      reason:
        s.status === 'partial'
          ? 'Limited project evidence relative to the claim.'
          : s.claimed
            ? 'Claimed on resume but no observable project evidence found.'
            : 'Required for the target role and not evidenced yet.',
    }))
    .sort((a, b) => rank[a.priority] - rank[b.priority] || a.skill.localeCompare(b.skill))
}

const COURSE_MAP: Record<string, string> = {
  docker: 'Docker Essentials (freeCodeCamp / official docs labs)',
  kubernetes: 'Kubernetes basics — KodeKloud intro path',
  'system design': 'Grokking System Design fundamentals',
  sql: 'Mode SQL tutorial + build one dashboard',
  typescript: 'TypeScript Handbook + migrate one JS project',
  react: 'React docs — build a small CRUD app with hooks',
  python: 'Real Python projects track',
  'machine learning': 'fast.ai Practical Deep Learning Lesson 1–3',
  tensorflow: 'TensorFlow Developer Certificate prep modules',
  pytorch: 'PyTorch official tutorials — tensors to training loop',
  figma: 'Figma for UX — redesign one mobile flow',
  'ui design': 'Refactor UI checklist + one case study write-up',
  testing: 'Jest + React Testing Library crash course',
  aws: 'AWS Cloud Practitioner free digital training',
  'rest api': 'Build & document one FastAPI/Express service',
}

function courseFor(skill?: string) {
  if (!skill) return 'Pick one role-aligned free course and finish week 1 modules'
  return COURSE_MAP[skill] ?? `Find a short project-based course for ${skill} and ship one artifact`
}

function buildRoadmap(
  gaps: SkillGap[],
  targetTitle: string,
  projects: string[],
): RoadmapStep[] {
  const g0 = gaps[0]?.skill
  const g1 = gaps[1]?.skill
  const g2 = gaps[2]?.skill

  return [
    {
      week: 'Week 1',
      title: g0 ? `Strengthen ${g0}` : 'Attach proof to your weakest claim',
      why: g0
        ? `${g0} is a high-priority gap for ${targetTitle}.`
        : `Close the biggest evidence hole for ${targetTitle}.`,
      actions: [
        g0
          ? `Complete 1–2 focused projects that visibly use ${g0}.`
          : 'Pick one unverified resume skill and ship a public project for it.',
        'Document problem → approach → result in the README.',
        'Link the repo next to the claim on your resume.',
      ],
      courses: [courseFor(g0)],
      milestone: g0
        ? `${g0} moves from unverified/partial toward verified`
        : 'One claim upgraded with real proof',
    },
    {
      week: 'Week 2',
      title: g1 ? `Build a ${g1}-aligned project` : 'Deepen project quality',
      why: 'Employers trust shipped work more than keyword lists.',
      actions: [
        g1
          ? `Ship a role-aligned project centered on ${g1}.`
          : projects[0]
            ? `Upgrade "${projects[0].slice(0, 55)}" with tests, deploy link, and metrics.`
            : 'Build one end-to-end project for your target role.',
        'Add before/after metrics or demo screenshots.',
        'Keep GitHub activity consistent (commits across the week).',
      ],
      courses: [courseFor(g1), 'Write one LinkedIn post documenting what you shipped'],
      milestone: 'At least one substantial, documented public project',
    },
    {
      week: 'Week 3',
      title: g2 ? `Close ${g2} with a deployable demo` : 'Deploy one project',
      why: 'Deployment proves you can take work beyond a notebook or local folder.',
      actions: [
        g2
          ? `Use ${g2} in a small deployed service or demo.`
          : 'Deploy one project (API, dashboard, or static site).',
        'Write a short case study for LinkedIn/portfolio.',
        'Remove or demote skills that still lack evidence.',
      ],
      courses: [courseFor(g2)],
      milestone: 'Live demo URL + clean GitHub documentation',
    },
    {
      week: 'Week 4',
      title: 'Polish profile storytelling',
      why: 'Placement teams and recruiters need a unified narrative across sources.',
      actions: [
        'Rewrite resume bullets to mirror verified project outcomes.',
        'Feature your best repos on GitHub and LinkedIn.',
        'Practice explaining every verified strength in interview form.',
      ],
      courses: ['Mock interview practice inside CareerLens Interview Coach'],
      milestone: 'Claims and proof-of-work sources stay consistent',
    },
  ]
}

function explanations(
  score: number,
  breakdown: ScoreBreakdown,
  skills: SkillEvidence[],
  gaps: SkillGap[],
  weights: ScoreWeights,
): string[] {
  const lines: string[] = []
  lines.push(
    `Why ${score}? Score = ${weights.evidence}% evidence (${breakdown.evidence}) + ${weights.projects}% projects (${breakdown.projects}) + ${weights.roleFit}% role fit (${breakdown.roleFit}) + ${weights.activity}% activity (${breakdown.activity}) + ${weights.profile}% profile (${breakdown.profile}). Weights are configurable by the placement cell.`,
  )

  for (const s of skills.filter((x) => x.status === 'verified').slice(0, 3)) {
    lines.push(
      `${s.skill} is verified (${s.score}%) — ${
        s.proofNotes[0] ?? 'observable project/repo evidence found'
      }.`,
    )
  }

  for (const g of gaps.slice(0, 3)) {
    const skill = skills.find((s) => s.skill === g.skill)
    lines.push(
      `${g.skill} is ${skill?.status ?? 'weak'} (${skill?.score ?? 0}%) — ${g.reason}`,
    )
  }

  return lines
}

export async function analyzeCandidate(
  input: CandidateInput,
): Promise<AnalysisResult> {
  const roles = getConfiguredRoles()
  const role =
    roles.find((r) => r.id === input.targetRoleId) ??
    roles[0] ??
    getConfiguredRoles()[0]
  const weights = loadWeights()
  const resumeSkills = extractSkillsFromText(input.resumeText)
  const linkedinSkills = extractLinkedinSignals(input.linkedinDetails ?? '')
  const projects = extractProjects(input.resumeText)
  const sources = detectSourcesFromLinks(input.links)
  const proofMap = new Map<
    string,
    { sources: EvidenceSource[]; notes: string[]; count: number }
  >()

  for (const skill of resumeSkills) {
    const inProject = projects.some((p) => p.toLowerCase().includes(skill))
    if (inProject) {
      addProof(
        proofMap,
        skill,
        'resume',
        `Mentioned inside a project narrative on the resume`,
        1,
      )
    }
  }

  for (const skill of linkedinSkills) {
    addProof(
      proofMap,
      skill,
      'linkedin',
      'Mentioned in LinkedIn details / certifications notes',
      1,
    )
  }

  let github: GithubProfileSignal | null = null
  const username = parseGithubUsername(input.links.github)
  if (username) {
    github = await fetchGithubSignals(username)
    if (github) {
      for (const [skill, count] of Object.entries(github.skillRepoHits)) {
        addProof(
          proofMap,
          skill,
          'github',
          `${count} GitHub repositories/projects related to ${skill}`,
          count,
        )
      }
      for (const lang of github.languages) {
        addProof(
          proofMap,
          lang,
          'github',
          `Primary language observed across public repositories`,
          github.languageCounts[lang] ?? 1,
        )
      }
    } else {
      for (const skill of resumeSkills.slice(0, 2)) {
        addProof(
          proofMap,
          skill,
          'github',
          'GitHub profile linked (live scan unavailable — rate limit or network)',
          1,
        )
      }
    }
  }

  if (input.links.portfolio.trim()) {
    for (const skill of resumeSkills.filter((s) =>
      ['react', 'html', 'css', 'javascript', 'typescript', 'ui design', 'figma'].includes(s),
    )) {
      addProof(proofMap, skill, 'portfolio', 'Portfolio link provided as supporting proof', 1)
    }
  }

  if (input.links.behance.trim() || input.links.figma.trim() || input.links.dribbble.trim()) {
    for (const skill of ['figma', 'ui design', 'ux research', 'prototyping', 'design systems']) {
      if (resumeSkills.includes(skill) || role.mustHave.includes(skill)) {
        const source: EvidenceSource = input.links.behance.trim()
          ? 'behance'
          : input.links.figma.trim()
            ? 'figma'
            : 'dribbble'
        addProof(proofMap, skill, source, 'Design portfolio linked as supporting proof', 1)
      }
    }
  }

  if (input.links.leetcode.trim() || input.links.hackerrank.trim()) {
    addProof(
      proofMap,
      'data structures',
      input.links.leetcode.trim() ? 'leetcode' : 'hackerrank',
      'Coding practice profile linked (consistency signal)',
      1,
    )
  }

  if (input.links.kaggle.trim()) {
    for (const skill of ['python', 'pandas', 'machine learning', 'statistics']) {
      if (resumeSkills.includes(skill) || role.mustHave.includes(skill)) {
        addProof(proofMap, skill, 'kaggle', 'Kaggle profile linked as learning/project evidence', 1)
      }
    }
  }

  if (input.links.certificates.trim()) {
    for (const skill of resumeSkills.slice(0, 3)) {
      addProof(
        proofMap,
        skill,
        'certificate',
        'Certificate / learning link provided by student',
        1,
      )
    }
  }

  if (input.links.linkedin.trim()) {
    for (const skill of resumeSkills.slice(0, 4)) {
      addProof(
        proofMap,
        skill,
        'linkedin',
        'Professional profile linked for narrative consistency',
        0,
      )
    }
  }

  const claimed = unique([...resumeSkills, ...linkedinSkills])
  const skills = buildSkills(
    claimed,
    proofMap,
    [...role.mustHave, ...role.niceToHave],
    github,
  )
  const breakdown = computeBreakdown(skills, role.mustHave, projects, sources, github)
  const readinessScore = overallScore(breakdown, weights)
  const gapItems = buildGaps(skills, role.mustHave)
  const gaps = skills.filter((s) => gapItems.some((g) => g.skill === s.skill))
  const verifiedStrengths = skills
    .filter((s) => s.status === 'verified')
    .map((s) => s.skill)
  const fits = roleFits(skills, role.id)
  const feedback = buildFeedback({
    resumeText: input.resumeText,
    skills,
    projects,
    sources,
    hasGithub: Boolean(username),
    githubRepos: github?.publicRepos,
  })

  return {
    candidateName: input.name.trim() || 'Candidate',
    targetRoleId: role.id,
    targetRoleTitle: role.title,
    readinessScore,
    readinessLabel: readinessLabel(readinessScore),
    activityConsistencyScore: breakdown.activity,
    tagline: "Don't tell us what you know. Show us the evidence.",
    summary: `CareerLens cross-checked ${claimed.length} claimed skills against observable proof and mapped readiness to ${role.title}.`,
    breakdown,
    weightsUsed: weights,
    explanations: explanations(readinessScore, breakdown, skills, gapItems, weights),
    skills,
    verifiedStrengths,
    gaps,
    gapItems,
    roleFits: fits,
    roadmap: buildRoadmap(gapItems, role.title, projects),
    feedback,
    radar: [
      { label: 'Evidence', value: breakdown.evidence },
      { label: 'Projects', value: breakdown.projects },
      { label: 'Role fit', value: breakdown.roleFit },
      { label: 'Activity', value: breakdown.activity },
      { label: 'Profile', value: breakdown.profile },
    ],
    sourcesUsed: sources,
    projectsDetected: projects,
    githubStats: github
      ? {
          publicRepos: github.publicRepos,
          followers: github.followers,
          languages: github.languages,
          recentActivityScore: github.recentActivityScore,
          stars: github.stars,
        }
      : undefined,
    analyzedAt: new Date().toISOString(),
  }
}

export const SAMPLE_RESUME = `Arjun Sharma
Aspiring Machine Learning Engineer
Email: arjun@email.com | GitHub: arjun-ml | LinkedIn: linkedin.com/in/arjunsharma

SUMMARY
Computer Science student targeting ML Engineer roles. Comfortable with Python, data workflows,
and building learning projects. Looking for internships in applied machine learning.

SKILLS
Python, TensorFlow, SQL, React, Machine Learning, Git, Statistics, Pandas, NumPy, Deep Learning

PROJECTS
House Price Predictor — Built a Python machine learning regression project using Pandas and NumPy.
Documented feature engineering steps and evaluation metrics in the README.

Campus Sentiment Classifier — Created a text classification notebook with scikit-learn for campus feedback.
Shared charts for accuracy and confusion matrix.

Portfolio Website — Developed a React frontend to showcase projects and resume highlights.

EXPERIENCE
Data Club Member — Mentored juniors on Python basics and Git workflows for hackathon prep.

EDUCATION
B.Tech Computer Science, 2026
Certifications: Coursera Machine Learning Foundations
`

export const SAMPLE_GITHUB = 'https://github.com/scikit-learn'

export const SAMPLE_LINKEDIN_DETAILS = `Experience: Data Club Member (2024–present)
Certifications: Coursera Machine Learning Foundations; Google Data Analytics (in progress)
Activity: Weekly posts on Python notebooks and model evaluation notes
Skills endorsed: Python, SQL, Machine Learning, Pandas`
