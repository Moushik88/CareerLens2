import type { AnalysisResult } from './types'

export interface InterviewQuestion {
  id: string
  skill: string
  prompt: string
  rubric: string[]
}

export interface InterviewTurn {
  questionId: string
  answer: string
  score: number
  feedback: string
}

export function buildInterviewQuestions(result: AnalysisResult): InterviewQuestion[] {
  const strengths = result.skills.filter((s) => s.status === 'verified' || s.status === 'partial')
  const gaps = result.gapItems
  const projects = result.projectsDetected
  const questions: InterviewQuestion[] = []

  for (const skill of strengths.slice(0, 3)) {
    const project = projects[0] ?? 'one of your public projects'
    questions.push({
      id: `s-${skill.skill}`,
      skill: skill.skill,
      prompt: `Walk me through how you used ${skill.skill} in "${project}". What decision would you change if you rebuilt it?`,
      rubric: [
        'Names a concrete project artifact',
        `Explains a real ${skill.skill} trade-off`,
        'Mentions outcome or metric',
      ],
    })
  }

  for (const gap of gaps.slice(0, 2)) {
    questions.push({
      id: `g-${gap.skill}`,
      skill: gap.skill,
      prompt: `${gap.skill} is a gap for ${result.targetRoleTitle}. How would you learn and prove it in the next 30 days?`,
      rubric: [
        'Has a concrete learning plan',
        'Proposes a public proof artifact',
        'Sets a realistic weekly cadence',
      ],
    })
  }

  if (questions.length < 3) {
    questions.push({
      id: 'general-fit',
      skill: result.targetRoleTitle,
      prompt: `Why are you a fit for ${result.targetRoleTitle} based on evidence you can show today?`,
      rubric: ['Ties claims to proof', 'Shows role awareness', 'Clear communication'],
    })
  }

  return questions.slice(0, 5)
}

/** Lightweight heuristic “AI coach” scoring for demo (no external LLM required). */
export function scoreAnswer(question: InterviewQuestion, answer: string): InterviewTurn {
  const text = answer.trim()
  const words = text.split(/\s+/).filter(Boolean)
  let score = 20
  const hits: string[] = []

  if (words.length >= 40) {
    score += 20
    hits.push('Enough depth')
  } else if (words.length >= 18) {
    score += 10
  }

  if (new RegExp(question.skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text)) {
    score += 15
    hits.push(`Mentioned ${question.skill}`)
  }

  if (/\b(because|trade-?off|decided|chose|metric|result|improved|built|shipped)\b/i.test(text)) {
    score += 20
    hits.push('Reasoning / ownership language')
  }

  if (/\d+%|\d+\+|users|accuracy|latency|stars|commits/i.test(text)) {
    score += 15
    hits.push('Included a concrete signal')
  }

  if (words.length < 8) score = Math.min(score, 25)

  score = Math.max(0, Math.min(100, score))
  const missing = question.rubric.filter(
    (r) =>
      !hits.some((h) => h.toLowerCase().includes(r.toLowerCase().slice(0, 6))) &&
      !(r.toLowerCase().includes('metric') && hits.some((h) => h.includes('signal'))),
  )

  return {
    questionId: question.id,
    answer: text,
    score,
    feedback:
      score >= 70
        ? `Strong answer. ${hits.join(' · ') || 'Clear structure'}.`
        : `Needs more proof. Cover: ${missing.slice(0, 2).join('; ') || question.rubric[0]}.`,
  }
}
