import { Link } from 'react-router-dom'
import { clearProgress, loadProgress } from '../lib/progressStore'

export function Dashboard() {
  const history = loadProgress()
  const latest = history[0]
  const previous = history[1]
  const delta =
    latest && previous ? latest.readinessScore - previous.readinessScore : null

  return (
    <div className="page container">
      <h1 className="page-title">Progress dashboard</h1>
      <p className="page-sub">
        Track Job Readiness and Activity scores across analyses — re-run Analyze after you ship
        proof to see improvement over time.
      </p>

      {!latest ? (
        <div className="panel empty-state">
          <h2 className="page-title" style={{ fontSize: '1.4rem' }}>
            No progress yet
          </h2>
          <p className="hint">Complete an analysis to start your progress trail.</p>
          <Link to="/analyze" className="btn btn-primary">
            Analyze profile
          </Link>
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat">
              <span>Latest readiness</span>
              <strong>{latest.readinessScore}</strong>
            </div>
            <div className="stat">
              <span>Activity & consistency</span>
              <strong>{latest.activityConsistencyScore}</strong>
            </div>
            <div className="stat">
              <span>Verified skills</span>
              <strong>{latest.verifiedCount}</strong>
            </div>
            <div className="stat">
              <span>Change vs last run</span>
              <strong>
                {delta === null ? '—' : delta > 0 ? `+${delta}` : `${delta}`}
              </strong>
            </div>
          </div>

          <div className="panel" style={{ marginTop: '1.1rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
                marginBottom: '1rem',
              }}
            >
              <h3 style={{ margin: 0 }}>Score history</h3>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  clearProgress()
                  window.location.reload()
                }}
              >
                Clear history
              </button>
            </div>

            <div className="progress-bars">
              {[...history].reverse().map((snap) => (
                <div className="progress-row" key={snap.id}>
                  <div>
                    <strong>{snap.readinessScore}</strong>
                    <span className="hint">
                      {' '}
                      · {snap.targetRoleTitle} ·{' '}
                      {new Date(snap.analyzedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="bar">
                    <i style={{ width: `${snap.readinessScore}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/results" className="btn btn-secondary">
              Latest report
            </Link>
            <Link to="/interview" className="btn btn-primary">
              Mock interview coach
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
