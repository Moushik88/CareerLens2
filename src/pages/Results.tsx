import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { RadarChart } from '../components/RadarChart'
import { ScoreRing } from '../components/ScoreRing'
import { loadAnalysis } from '../lib/analysisStore'
import type { FeedbackItem, SkillEvidence, SkillStatus } from '../lib/types'

function statusClass(status: SkillStatus) {
  if (status === 'verified') return 'pill good'
  if (status === 'partial') return 'pill warn'
  if (status === 'unverified') return 'pill bad'
  return 'pill'
}

function statusIcon(status: SkillStatus) {
  if (status === 'verified') return '🟢'
  if (status === 'partial') return '🟡'
  if (status === 'unverified') return '🔴'
  return '⚪'
}

function severityClass(severity: FeedbackItem['severity']) {
  if (severity === 'strength') return 'pill good'
  if (severity === 'improve') return 'pill warn'
  return 'pill bad'
}

function ClaimCard({ skill }: { skill: SkillEvidence }) {
  return (
    <article className="claim-card">
      <div className="claim-head">
        <h4>
          {statusIcon(skill.status)} {skill.skill}
        </h4>
        <strong>{skill.score}%</strong>
      </div>
      <div className="bar">
        <i style={{ width: `${skill.score}%` }} />
      </div>
      <div className="claim-meta">
        <span className={statusClass(skill.status)}>{skill.status}</span>
        <span className="hint">
          Claimed {skill.claimed ? '✓' : '—'} · Evidence {skill.evidenceCount || 0}
        </span>
      </div>
      <div className="claim-body">
        <p>
          <strong>CLAIM</strong> {skill.claimed ? 'Listed on resume' : 'Not listed — role requirement'}
        </p>
        <p>
          <strong>EVIDENCE</strong>{' '}
          {skill.proofNotes.length
            ? skill.proofNotes.slice(0, 3).join(' · ')
            : 'No observable project evidence found'}
        </p>
        {skill.sources.length ? (
          <div className="source-tags">
            {skill.sources.map((s) => (
              <span className="tag" key={s}>
                {s}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}

export function Results() {
  const result = useMemo(() => loadAnalysis(), [])

  if (!result) {
    return (
      <div className="page container">
        <div className="panel empty-state">
          <h1 className="page-title">No analysis yet</h1>
          <p className="page-sub" style={{ marginInline: 'auto' }}>
            Upload a resume + GitHub, then run ANALYZE PROFILE.
          </p>
          <Link to="/analyze" className="btn btn-primary">
            Go to Analyze
          </Link>
        </div>
      </div>
    )
  }

  const spotlight = result.skills
    .filter((s) => s.claimed || result.gapItems.some((g) => g.skill === s.skill))
    .slice(0, 8)

  const weights = result.weightsUsed
  const metrics = [
    ['Skill evidence', result.breakdown.evidence, `${weights.evidence}%`],
    ['Project quality', result.breakdown.projects, `${weights.projects}%`],
    ['Role alignment', result.breakdown.roleFit, `${weights.roleFit}%`],
    ['Activity', result.breakdown.activity, `${weights.activity}%`],
    ['Profile', result.breakdown.profile, `${weights.profile}%`],
  ] as const

  const radar =
    result.radar?.length >= 3
      ? result.radar
      : [
          { label: 'Evidence', value: result.breakdown.evidence },
          { label: 'Projects', value: result.breakdown.projects },
          { label: 'Role fit', value: result.breakdown.roleFit },
          { label: 'Activity', value: result.breakdown.activity },
          { label: 'Profile', value: result.breakdown.profile },
        ]

  return (
    <div className="page container">
      <p className="hint" style={{ marginBottom: '0.35rem' }}>
        {result.tagline}
      </p>
      <h1 className="page-title">CareerLens Report</h1>
      <p className="page-sub">
        {result.summary} Generated {new Date(result.analyzedAt).toLocaleString()}.
      </p>

      <div className="panel report-shell">
        <div className="results-hero">
          <ScoreRing score={result.readinessScore} label={result.readinessLabel} />
          <div>
            <p className="pill good" style={{ marginBottom: '0.8rem' }}>
              TARGET · {result.targetRoleTitle.toUpperCase()}
            </p>
            <h2 style={{ margin: '0 0 0.6rem', fontFamily: 'var(--font-display)' }}>
              {result.candidateName}
            </h2>
            <p className="hint" style={{ marginBottom: '1rem' }}>
              Job Readiness{' '}
              <strong style={{ color: 'var(--ink)' }}>{result.readinessScore}/100</strong>
              {' · '}
              Activity & Consistency{' '}
              <strong style={{ color: 'var(--ink)' }}>
                {result.activityConsistencyScore ?? result.breakdown.activity}/100
              </strong>
              {result.githubStats
                ? ` · ${result.githubStats.publicRepos} repos · GH activity ${result.githubStats.recentActivityScore}/100`
                : ''}
            </p>
            <div className="skill-score-list">
              {spotlight.slice(0, 5).map((s) => (
                <div key={s.skill} className="skill-score-row">
                  <span>
                    {statusIcon(s.status)} {s.skill}
                  </span>
                  <div className="bar">
                    <i style={{ width: `${s.score}%` }} />
                  </div>
                  <strong>{s.score}%</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="radar-wrap">
            <h3 style={{ marginTop: 0, textAlign: 'center' }}>Strengths radar</h3>
            <RadarChart data={radar} />
          </div>
        </div>
      </div>

      <div className="score-grid">
        {metrics.map(([label, value, weight]) => (
          <div className="metric" key={label}>
            <span>
              {label} · {weight}
            </span>
            <strong>{value}</strong>
            <div className="bar">
              <i style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginTop: '1.1rem' }}>
        <h3>Why {result.readinessScore}?</h3>
        <ul className="explain-list">
          {result.explanations.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="panel" style={{ marginTop: '1.1rem' }}>
        <h3>Claim → Evidence</h3>
        <p className="hint" style={{ marginBottom: '1rem' }}>
          The student isn&apos;t judged on what they claim — they&apos;re judged on what they can
          demonstrate.
        </p>
        <div className="claim-grid">
          {spotlight.map((skill) => (
            <ClaimCard key={skill.skill} skill={skill} />
          ))}
        </div>
      </div>

      <div className="panel-grid">
        <div className="panel">
          <h3>Skill gaps</h3>
          {result.gapItems.length === 0 ? (
            <p className="hint">No critical gaps for this target role.</p>
          ) : (
            <div className="skill-list">
              {result.gapItems.map((gap) => (
                <div className="skill-row" key={gap.skill} style={{ gridTemplateColumns: '1fr' }}>
                  <div>
                    <div className="skill-name">{gap.skill}</div>
                    <span className={gap.priority === 'high' ? 'pill bad' : 'pill warn'}>
                      {gap.priority} priority
                    </span>
                    <p className="hint" style={{ marginTop: '0.45rem' }}>
                      {gap.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="panel">
          <h3>Role-fit (3+ targets)</h3>
          <div className="role-grid" style={{ gridTemplateColumns: '1fr' }}>
            {result.roleFits.slice(0, 4).map((role) => (
              <article className="role-card" key={role.roleId}>
                <h4>{role.title}</h4>
                <div className="fit">{role.fitScore}%</div>
                <p className="hint">{role.rationale}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '1.1rem' }}>
        <h3>AI resume & portfolio feedback</h3>
        <p className="hint" style={{ marginBottom: '1rem' }}>
          Heuristic coach grounded in your claim→evidence map (no API key required for the demo).
        </p>
        <div className="claim-grid">
          {[...(result.feedback ?? [])]
            .sort((a, b) => {
              const rank = { critical: 0, improve: 1, strength: 2 } as const
              return rank[a.severity] - rank[b.severity]
            })
            .map((item) => (
            <article className="claim-card" key={`${item.area}-${item.title}`}>
              <div className="claim-head">
                <h4>{item.title}</h4>
                <span className={severityClass(item.severity)}>{item.severity}</span>
              </div>
              <p className="hint">{item.area.toUpperCase()}</p>
              <p style={{ margin: '0.55rem 0 0', color: 'var(--muted)', fontSize: '0.92rem' }}>
                {item.detail}
              </p>
              {item.rewriteSuggestion ? (
                <p style={{ margin: '0.65rem 0 0', fontSize: '0.92rem' }}>
                  <strong>Rewrite · </strong>
                  {item.rewriteSuggestion}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      <div className="panel" style={{ marginTop: '1.1rem' }}>
        <h3>30-day roadmap</h3>
        <div className="roadmap">
          {result.roadmap.map((step) => (
            <article className="roadmap-step" key={step.week}>
              <div className="week">{step.week}</div>
              <div>
                <strong>{step.title}</strong>
                <p className="hint" style={{ margin: '0.35rem 0' }}>
                  {step.why}
                </p>
                <ul>
                  {step.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
                {step.courses?.length ? (
                  <p className="hint" style={{ marginTop: '0.55rem' }}>
                    <strong>Courses · </strong>
                    {step.courses.join(' · ')}
                  </p>
                ) : null}
                <p style={{ margin: '0.65rem 0 0' }}>
                  <span className="pill">Milestone · {step.milestone}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link to="/analyze" className="btn btn-secondary">
          Analyze another profile
        </Link>
        <Link to="/dashboard" className="btn btn-secondary">
          Progress dashboard
        </Link>
        <Link to="/interview" className="btn btn-secondary">
          Mock interview
        </Link>
        <Link to="/placement" className="btn btn-primary">
          Placement cell insights
        </Link>
      </div>
    </div>
  )
}
