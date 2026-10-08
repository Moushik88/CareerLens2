import { SKILL_ALIASES, TARGET_ROLES } from '../data/roles'
import type { EvidenceSource, ProfileLinks } from './types'

const CANONICAL_SKILLS = [
  ...new Set(
    TARGET_ROLES.flatMap((role) => [...role.mustHave, ...role.niceToHave]),
  ),
].sort((a, b) => b.length - a.length)

/** Normalize free-text skill tokens via aliases + lowercase. */
export function normalizeSkill(raw: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[_/]+/g, ' ')
    .replace(/\s+/g, ' ')
  if (!cleaned) return ''
  return SKILL_ALIASES[cleaned] ?? cleaned
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Dictionary match of known role skills inside resume text. */
export function extractSkillsFromText(text: string): string[] {
  const haystack = text.toLowerCase()
  const found = new Set<string>()

  for (const [alias, canonical] of Object.entries(SKILL_ALIASES)) {
    const pattern = new RegExp(
      `(?:^|[^a-z0-9.+#])${escapeRegExp(alias)}(?:[^a-z0-9.+#]|$)`,
      'i',
    )
    if (pattern.test(haystack)) found.add(canonical)
  }

  for (const skill of CANONICAL_SKILLS) {
    const pattern = new RegExp(
      `(?:^|[^a-z0-9.+#])${escapeRegExp(skill)}(?:[^a-z0-9.+#]|$)`,
      'i',
    )
    if (pattern.test(haystack)) found.add(skill)
  }

  for (const line of text.split(/\r?\n/)) {
    if (!/skill/i.test(line) && !/,/.test(line)) continue
    for (const part of line.split(/[,|/•·]/)) {
      const normalized = normalizeSkill(part.replace(/^skills?\s*:?\s*/i, ''))
      if (normalized && CANONICAL_SKILLS.includes(normalized)) found.add(normalized)
    }
  }

  return [...found]
}

/** Pull project titles from a PROJECTS section or dash-separated bullets. */
export function extractProjects(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const projects: string[] = []
  let inProjects = false

  for (const line of lines) {
    if (/^projects?\b/i.test(line)) {
      inProjects = true
      continue
    }
    if (
      inProjects &&
      /^(experience|education|skills|summary|certifications?)\b/i.test(line)
    ) {
      break
    }

    if (inProjects) {
      const title = line.split(/\s+[—–\-|:]\s+/)[0]?.trim()
      if (title && title.length > 2 && title.length < 120) projects.push(title)
      continue
    }

    const emDash = line.match(/^(.{3,80}?)\s+[—–]\s+.{10,}/)
    if (emDash?.[1] && /built|created|developed|designed|implemented/i.test(line)) {
      projects.push(emDash[1].trim())
    }
  }

  return [...new Set(projects)].slice(0, 12)
}

export function detectSourcesFromLinks(links: ProfileLinks): EvidenceSource[] {
  const sources: EvidenceSource[] = ['resume']
  if (links.github.trim()) sources.push('github')
  if (links.linkedin.trim()) sources.push('linkedin')
  if (links.portfolio.trim()) sources.push('portfolio')
  if (links.behance.trim()) sources.push('behance')
  if (links.figma.trim()) sources.push('figma')
  if (links.dribbble.trim()) sources.push('dribbble')
  if (links.leetcode.trim()) sources.push('leetcode')
  if (links.kaggle.trim()) sources.push('kaggle')
  if (links.hackerrank.trim()) sources.push('hackerrank')
  if (links.certificates.trim()) sources.push('certificate')
  return sources
}

/** Accept a GitHub URL or bare username. */
export function parseGithubUsername(value: string): string | null {
  const raw = value.trim()
  if (!raw) return null

  const urlMatch = raw.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)(?:\/|$)/i,
  )
  if (urlMatch?.[1]) return urlMatch[1]

  if (/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(raw)) return raw

  return null
}

/** Certifications / skills mentioned in pasted LinkedIn details. */
export function extractLinkedinSignals(details: string): string[] {
  if (!details.trim()) return []
  return extractSkillsFromText(details)
}
