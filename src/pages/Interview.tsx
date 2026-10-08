import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadAnalysis } from '../lib/analysisStore'
import {
  buildInterviewQuestions,
  scoreAnswer,
  type InterviewTurn,
} from '../lib/interview'

export function Interview() {
  const result = useMemo(() => loadAnalysis(), [])
  const questions = useMemo(
    () => (result ? buildInterviewQuestions(result) : []),
    [result],
  )
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [turns, setTurns] = useState<InterviewTurn[]>([])

  if (!result) {
    return (
      <div className="page container">
        <div className="panel empty-state">
          <h1 className="page-title">Mock interview coach</h1>
          <p className="page-sub" style={{ marginInline: 'auto' }}>
            Run an analysis first — questions are tailored to your verified projects and gaps.
          </p>
          <Link to="/analyze" className="btn btn-primary">
            Analyze profile
          </Link>
        </div>
      </div>
    )
  }

  const q = questions[index]
  const avg =
    turns.length === 0
      ? null
      : Math.round(turns.reduce((s, t) => s + t.score, 0) / turns.length)

  function submit() {
    if (!q || !answer.trim()) return
    const turn = scoreAnswer(q, answer)
    setTurns((prev) => [...prev.filter((t) => t.questionId !== q.id), turn])
    setAnswer('')
    if (index < questions.length - 1) setIndex((i) => i + 1)
  }

  return (
    <div className="page container">
      <h1 className="page-title">Mock interview coach</h1>
      <p className="page-sub">
        Tailored to {result.candidateName}&apos;s {result.targetRoleTitle} evidence — practice
        explaining your own projects, not generic trivia.
      </p>

      <div className="stat-grid">
        <div className="stat">
          <span>Questions</span>
          <strong>
            {index + 1}/{questions.length}
          </strong>
        </div>
        <div className="stat">
          <span>Session avg</span>
          <strong>{avg ?? '—'}</strong>
        </div>
        <div className="stat">
          <span>Target role</span>
          <strong style={{ fontSize: '1.2rem' }}>{result.targetRoleTitle}</strong>
        </div>
      </div>

      {q ? (
        <div className="panel" style={{ marginTop: '1.1rem' }}>
          <p className="pill" style={{ marginBottom: '0.8rem' }}>
            Focus · {q.skill}
          </p>
          <h3 style={{ marginTop: 0 }}>{q.prompt}</h3>
          <p className="hint">Rubric: {q.rubric.join(' · ')}</p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Answer in 4–8 sentences. Name the project, the trade-off, and a metric if you have one."
            style={{ minHeight: 140, marginTop: '0.8rem' }}
          />
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.9rem' }}>
            <button type="button" className="btn btn-primary" onClick={submit}>
              Submit answer
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIndex((i) => Math.min(i + 1, questions.length - 1))}
            >
              Skip
            </button>
          </div>
        </div>
      ) : null}

      {turns.length ? (
        <div className="panel" style={{ marginTop: '1.1rem' }}>
          <h3>Coach feedback</h3>
          <div className="skill-list">
            {turns.map((t) => {
              const question = questions.find((x) => x.id === t.questionId)
              return (
                <div className="skill-row" key={t.questionId} style={{ gridTemplateColumns: '1fr' }}>
                  <div>
                    <div className="skill-name">{question?.skill ?? t.questionId}</div>
                    <span className={t.score >= 70 ? 'pill good' : t.score >= 45 ? 'pill warn' : 'pill bad'}>
                      {t.score}/100
                    </span>
                    <p className="hint" style={{ marginTop: '0.45rem' }}>
                      {t.feedback}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: '1.25rem' }}>
        <Link to="/results" className="btn btn-secondary">
          Back to report
        </Link>
      </div>
    </div>
  )
}
