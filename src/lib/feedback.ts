import type { AnalysisResult, FeedbackItem, SkillEvidence } from './types'

function resumeLengthSignals(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  const hasProjects = /projects?/i.test(text)
  const hasMetrics = /\d+%|\d+\+|increased|reduced|improved|users|accuracy/i.test(text)
  const hasActionVerbs = /\b(built|developed|designed|led|implemented|created|shipped)\b/i.test(
    text,
  )
  return { lines: lines.length, hasProjects, hasMetrics, hasActionVerbs }
}

export function buildFeedback(args: {
  resumeText: string
  skills: SkillEvidence[]
  projects: string[]
  sources: string[]
  hasGithub: boolean
  githubRepos?: number
}): FeedbackItem[] {
  const items: FeedbackItem[] = []
  const sig = resumeLengthSignals(args.resumeText)
  const unverified = args.skills.filter((s) => s.claimed && s.status === 'unverified')
  const verified = args.skills.filter((s) => s.status === 'verified')

  if (verified.length >= 3) {
    items.push({
      area: 'profile',
      severity: 'strength',
      title: 'Strong evidence trail',
      detail: `${verified.length} skills are backed by observable proof across your linked sources.`,
    })
  }

  if (unverified.length) {
    const skill = unverified[0].skill
    items.push({
      area: 'resume',
      severity: 'critical',
      title: `Unverified claim: ${skill}`,
      detail: `${skill} appears on the resume but no project/repo/portfolio evidence was found.`,
      rewriteSuggestion: `Either remove "${skill}" or add a bullet that names the project + outcome where you used it (and link the repo).`,
    })
  }

  if (!sig.hasMetrics) {
    items.push({
      area: 'resume',
      severity: 'improve',
      title: 'Add measurable outcomes',
      detail: 'Bullets read as responsibilities more than results. Recruiters trust numbers.',
      rewriteSuggestion:
        'Rewrite 2 bullets as: Action + tool + impact (e.g. "Improved model F1 from 0.72 → 0.81 on campus feedback dataset").',
    })
  }

  if (!sig.hasActionVerbs) {
    items.push({
      area: 'resume',
      severity: 'improve',
      title: 'Lead with stronger verbs',
      detail: 'Start bullets with shipped / built / designed / led so proof of ownership is obvious.',
    })
  }

  if (args.projects.length < 2) {
    items.push({
      area: 'portfolio',
      severity: 'critical',
      title: 'Too few demonstrable projects',
      detail: 'Less than two clear projects were detected. Role-fit and project-quality scores stay muted without shipped work.',
      rewriteSuggestion:
        'Ship one public project aligned to your target role this week, with README + demo link.',
    })
  } else {
    items.push({
      area: 'portfolio',
      severity: 'strength',
      title: 'Project narrative present',
      detail: `Detected ${args.projects.length} project signals to use in interviews and portfolio case studies.`,
    })
  }

  if (args.hasGithub) {
    const repos = args.githubRepos ?? 0
    if (repos > 0 && repos < 4) {
      items.push({
        area: 'github',
        severity: 'improve',
        title: 'Thin public GitHub surface',
        detail: `Only ${repos} public repos visible. Prefer fewer polished repos over many empty forks.`,
        rewriteSuggestion:
          'Pin 3 role-aligned repos, add READMEs with problem → approach → result, and pin them on your profile.',
      })
    } else if (repos >= 4) {
      items.push({
        area: 'github',
        severity: 'strength',
        title: 'Public coding footprint',
        detail: `${repos} repositories give employers something concrete to inspect.`,
      })
    }
  }

  if (!args.sources.includes('linkedin')) {
    items.push({
      area: 'linkedin',
      severity: 'improve',
      title: 'LinkedIn narrative missing',
      detail: 'Add LinkedIn (or paste public details) so certifications and experience can boost consistency scoring.',
    })
  }

  if (!args.sources.includes('portfolio') && !args.sources.includes('behance') && !args.sources.includes('figma')) {
    items.push({
      area: 'portfolio',
      severity: 'improve',
      title: 'No design/personal portfolio linked',
      detail: 'A live portfolio or design case study strengthens professional presence — especially for frontend/design roles.',
    })
  }

  const severityRank = { critical: 0, improve: 1, strength: 2 } as const
  return items
    .slice(0, 8)
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
}

export function attachFeedback(result: AnalysisResult, resumeText: string): AnalysisResult {
  const feedback = buildFeedback({
    resumeText,
    skills: result.skills,
    projects: result.projectsDetected,
    sources: result.sourcesUsed,
    hasGithub: result.sourcesUsed.includes('github'),
    githubRepos: result.githubStats?.publicRepos,
  })
  return { ...result, feedback }
}
