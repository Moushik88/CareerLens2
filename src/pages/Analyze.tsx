import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { TARGET_ROLES, type RoleId } from '../data/roles'
import {
  analyzeCandidate,
  SAMPLE_GITHUB,
  SAMPLE_LINKEDIN_DETAILS,
  SAMPLE_RESUME,
} from '../lib/analyze'
import { saveAnalysis } from '../lib/analysisStore'
import { readResumeFile } from '../lib/pdfResume'
import { getConfiguredRoles } from '../lib/roleConfig'
import type { ProfileLinks } from '../lib/types'
import { loadWeights } from '../lib/weights'

const emptyLinks: ProfileLinks = {
  github: '',
  linkedin: '',
  portfolio: '',
  behance: '',
  figma: '',
  dribbble: '',
  leetcode: '',
  kaggle: '',
  hackerrank: '',
  certificates: '',
}

export function Analyze() {
  const navigate = useNavigate()
  const roles = getConfiguredRoles()
  const weights = loadWeights()
  const [name, setName] = useState('Arjun Sharma')
  const [email, setEmail] = useState('arjun@email.com')
  const [targetRoleId, setTargetRoleId] = useState<RoleId>('ml')
  const [resumeText, setResumeText] = useState(SAMPLE_RESUME)
  const [resumeFileName, setResumeFileName] = useState<string>()
  const [parseInfo, setParseInfo] = useState<string | null>(null)
  const [linkedinDetails, setLinkedinDetails] = useState(SAMPLE_LINKEDIN_DETAILS)
  const [links, setLinks] = useState<ProfileLinks>({
    ...emptyLinks,
    github: SAMPLE_GITHUB,
    linkedin: 'https://linkedin.com/in/arjunsharma',
    kaggle: 'https://kaggle.com',
  })
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onFile(file?: File | null) {
    if (!file) return
    setError(null)
    setParsing(true)
    setParseInfo(null)
    setResumeFileName(file.name)
    try {
      const result = await readResumeFile(file, (msg) => setParseInfo(msg))
      setResumeText(result.text)
      const methodLabel =
        result.method === 'ocr'
          ? 'OCR (scanned PDF)'
          : result.method === 'hybrid'
            ? 'text + OCR'
            : 'embedded text'
      setParseInfo(
        `Parsed ${result.pageCount} page(s) via ${methodLabel}.${
          result.warning ? ` ${result.warning}` : ''
        }`,
      )
      const firstLine = result.text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => l.length > 2 && l.length < 60 && !/@/.test(l))
      if (firstLine && !/skill|education|experience|project/i.test(firstLine)) {
        setName(firstLine)
      }
    } catch {
      setError('Could not read that file. Try PDF, DOCX, TXT, or paste the text.')
    } finally {
      setParsing(false)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!resumeText.trim()) {
      setError('Upload a resume (PDF/DOCX/TXT) or paste resume text.')
      return
    }
    if (!links.github.trim()) {
      setError('GitHub username or URL is required for evidence verification.')
      return
    }

    setLoading(true)
    try {
      const result = await analyzeCandidate({
        name,
        email,
        targetRoleId,
        resumeText,
        resumeFileName,
        links,
        linkedinDetails,
      })
      saveAnalysis(result)
      navigate('/results')
    } catch {
      setError('Analysis failed unexpectedly. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page container">
      <h1 className="page-title">Analyze profile</h1>
      <p className="page-sub">
        Upload resume + multi-source proof (GitHub, design, LinkedIn, optional coding platforms).
        CareerLens verifies claims against evidence using placement-configured weights (
        {weights.evidence}/{weights.projects}/{weights.roleFit}/{weights.activity}/
        {weights.profile}).
      </p>

      <form onSubmit={onSubmit}>
        <div className="panel-grid">
          <div className="panel">
            <h3>1 · Resume upload</h3>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="field full">
                <label htmlFor="role">Target role</label>
                <select
                  id="role"
                  value={targetRoleId}
                  onChange={(e) => setTargetRoleId(e.target.value as RoleId)}
                >
                  {(roles.length ? roles : TARGET_ROLES).map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title} — {role.domain}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field full">
                <label>Resume PDF / DOCX / text</label>
                <div className="file-row" style={{ marginBottom: '0.55rem' }}>
                  <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                    {parsing ? 'Parsing…' : 'Upload PDF / DOCX / TXT'}
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      hidden
                      disabled={parsing || loading}
                      onChange={(e) => void onFile(e.target.files?.[0])}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setResumeText(SAMPLE_RESUME)
                      setResumeFileName(undefined)
                      setName('Arjun Sharma')
                      setTargetRoleId('ml')
                      setLinkedinDetails(SAMPLE_LINKEDIN_DETAILS)
                      setLinks((prev) => ({
                        ...prev,
                        github: SAMPLE_GITHUB,
                        linkedin: 'https://linkedin.com/in/arjunsharma',
                        kaggle: 'https://kaggle.com',
                      }))
                      setParseInfo('Loaded Arjun demo resume (Meet Arjun story).')
                    }}
                  >
                    Load Arjun demo
                  </button>
                  {resumeFileName ? (
                    <span className="hint">File: {resumeFileName}</span>
                  ) : null}
                </div>
                {parseInfo ? <p className="hint">{parseInfo}</p> : null}
                <textarea
                  id="resume"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste resume text, or upload PDF/DOCX…"
                  required
                />
              </div>
              <div className="field full">
                <label htmlFor="linkedinDetails">
                  LinkedIn details (export notes or public summary)
                </label>
                <textarea
                  id="linkedinDetails"
                  value={linkedinDetails}
                  onChange={(e) => setLinkedinDetails(e.target.value)}
                  placeholder="Paste experience, certifications, posts, activity…"
                  style={{ minHeight: 110 }}
                />
                <span className="hint">
                  Used when LinkedIn API access isn’t available — paste public details or an export
                  excerpt.
                </span>
              </div>
            </div>
          </div>

          <div className="panel">
            <h3>2 · Evidence sources</h3>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="field">
                <label htmlFor="github">GitHub (required)</label>
                <input
                  id="github"
                  value={links.github}
                  onChange={(e) =>
                    setLinks((prev) => ({ ...prev, github: e.target.value }))
                  }
                  placeholder="https://github.com/username"
                  required
                />
              </div>
              {(
                [
                  ['linkedin', 'LinkedIn URL'],
                  ['portfolio', 'Personal portfolio'],
                  ['behance', 'Behance'],
                  ['figma', 'Figma'],
                  ['dribbble', 'Dribbble'],
                  ['leetcode', 'LeetCode (optional)'],
                  ['kaggle', 'Kaggle (optional)'],
                  ['hackerrank', 'HackerRank (optional)'],
                  ['certificates', 'Certificates / other proof links'],
                ] as const
              ).map(([key, label]) => (
                <div className="field" key={key}>
                  <label htmlFor={key}>{label}</label>
                  <input
                    id={key}
                    value={links[key]}
                    onChange={(e) =>
                      setLinks((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    placeholder="https://..."
                  />
                </div>
              ))}
            </div>

            <ul className="checklist" style={{ marginTop: '1.1rem' }}>
              <li>
                <span className="dot" />
                <div>
                  <strong>Claim → Evidence</strong>
                  <p className="hint">
                    Resume claims checked against GitHub, portfolios, and optional platforms.
                  </p>
                </div>
              </li>
              <li>
                <span className="dot" style={{ background: 'var(--amber)' }} />
                <div>
                  <strong>Configurable score weights</strong>
                  <p className="hint">
                    Placement Cell can change evidence / projects / role / activity / profile
                    weightages.
                  </p>
                </div>
              </li>
            </ul>

            {error ? (
              <p className="hint" style={{ color: 'var(--coral)', marginTop: '1rem' }}>
                {error}
              </p>
            ) : null}

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.2rem' }}
              disabled={loading || parsing}
              type="submit"
            >
              {loading ? (
                <span className="loading">
                  <span className="spinner" /> Analyzing profile…
                </span>
              ) : (
                'ANALYZE PROFILE'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
