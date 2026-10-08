import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <>
      <section className="hero">
        <div className="hero-media" aria-hidden="true" />
        <div className="container hero-content">
          <p className="hero-brand">CareerLens</p>
          <h1>Don&apos;t tell us what you know. Show us the evidence.</h1>
          <p>
            Upload resume (PDF/DOCX), connect GitHub + portfolios, get an explainable Job
            Readiness Score, radar chart, skill gaps, AI feedback, roadmap, and progress tracking.
          </p>
          <div className="hero-actions">
            <Link to="/analyze" className="btn btn-primary">
              Analyze my profile
            </Link>
            <Link to="/placement" className="btn btn-secondary">
              Placement cell
            </Link>
            <Link to="/dashboard" className="btn btn-secondary">
              Progress
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Built for evidence, not buzzwords</h2>
            <p>
              Students scatter proof across resumes, GitHub, design portfolios, and LinkedIn.
              CareerLens unifies those signals into one explainable readiness picture.
            </p>
          </div>
          <div className="feature-grid">
            <article className="feature">
              <span className="feature-index">01 · Multi-source</span>
              <h3>Profile & portfolio evaluation</h3>
              <p>
                Upload a resume and connect GitHub, LinkedIn, Behance, Figma, or a personal
                portfolio. Claims are cross-checked against observable project activity.
              </p>
            </article>
            <article className="feature">
              <span className="feature-index">02 · Transparent</span>
              <h3>Explainable readiness score</h3>
              <p>
                Every score breaks down into evidence match, project depth, consistency, role
                alignment, and professional presence — with plain-language reasons.
              </p>
            </article>
            <article className="feature">
              <span className="feature-index">03 · Actionable</span>
              <h3>Roadmap & role-fit guidance</h3>
              <p>
                Get verified strengths, skill-gap flags, target-role fit, and a week-by-week
                improvement plan placement cells can also track at batch level.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container panel">
          <div className="section-head" style={{ marginBottom: '1.2rem' }}>
            <h2>What you get in one pass</h2>
            <p>
              Designed for DataQuest 3.0 DQWL — evidence-based analysis plus actionable,
              explainable guidance for students and institutions.
            </p>
          </div>
          <ul className="checklist">
            <li>
              <span className="dot" />
              <div>
                <strong>Job Readiness Score</strong>
                <p className="hint">
                  Overall metric grounded in technical and project signals, not keyword stuffing.
                </p>
              </div>
            </li>
            <li>
              <span className="dot" style={{ background: 'var(--amber)' }} />
              <div>
                <strong>Skill gap report</strong>
                <p className="hint">
                  Missing or weakly evidenced skills relative to your target career domain.
                </p>
              </div>
            </li>
            <li>
              <span className="dot" style={{ background: 'var(--sky)' }} />
              <div>
                <strong>Personalized roadmap</strong>
                <p className="hint">
                  Concrete milestones that explain why the score is lower and how to raise it.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </>
  )
}
