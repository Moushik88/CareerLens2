import { useMemo, useState } from 'react'
import { TARGET_ROLES, type RoleId } from '../data/roles'
import { BATCH_STUDENTS, batchInsights } from '../data/batch'
import {
  loadRoleConfig,
  resetRoleConfig,
  saveRoleConfig,
  type RoleConfigState,
} from '../lib/roleConfig'
import type { ScoreWeights } from '../lib/types'
import {
  DEFAULT_WEIGHTS,
  loadWeights,
  resetWeights,
  saveWeights,
} from '../lib/weights'

export function Placement() {
  const [minScore, setMinScore] = useState(0)
  const [minFit, setMinFit] = useState(0)
  const [branch, setBranch] = useState('all')
  const [role, setRole] = useState('all')
  const [skillQuery, setSkillQuery] = useState('')
  const [weights, setWeights] = useState<ScoreWeights>(() => loadWeights())
  const [roleCfg, setRoleCfg] = useState<RoleConfigState>(() => loadRoleConfig())
  const [editRoleId, setEditRoleId] = useState<RoleId>('frontend')
  const [mustHaveText, setMustHaveText] = useState(
    () => TARGET_ROLES.find((r) => r.id === 'frontend')?.mustHave.join(', ') ?? '',
  )
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  const branches = useMemo(
    () => ['all', ...new Set(BATCH_STUDENTS.map((s) => s.branch))],
    [],
  )
  const roles = useMemo(
    () => ['all', ...new Set(BATCH_STUDENTS.map((s) => s.targetRole))],
    [],
  )

  const filtered = BATCH_STUDENTS.filter((s) => {
    if (s.readinessScore < minScore) return false
    if (s.roleFit < minFit) return false
    if (branch !== 'all' && s.branch !== branch) return false
    if (role !== 'all' && s.targetRole !== role) return false
    if (skillQuery.trim()) {
      const q = skillQuery.trim().toLowerCase()
      if (!s.skills.some((sk) => sk.includes(q)) && !s.topGap.toLowerCase().includes(q)) {
        return false
      }
    }
    return true
  }).sort((a, b) => b.readinessScore - a.readinessScore)

  const insights = batchInsights(filtered)

  function persistWeights() {
    const next = saveWeights(weights)
    setWeights(next)
    setSavedMsg('Scoring weights saved — new analyses will use them.')
  }

  function persistRoles() {
    const mustHave = mustHaveText
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    const next: RoleConfigState = {
      ...roleCfg,
      overrides: {
        ...roleCfg.overrides,
        [editRoleId]: {
          mustHave,
          niceToHave:
            roleCfg.overrides[editRoleId]?.niceToHave ??
            TARGET_ROLES.find((r) => r.id === editRoleId)?.niceToHave ??
            [],
        },
      },
    }
    saveRoleConfig(next)
    setRoleCfg(next)
    setSavedMsg('Target role requirements updated for scoring.')
  }

  return (
    <div className="page container">
      <h1 className="page-title">Placement cell insights</h1>
      <p className="page-sub">
        Filter the cohort, configure scoring weights & target roles, and spot who needs training
        before drives.
      </p>

      {savedMsg ? (
        <p className="pill good" style={{ marginBottom: '1rem' }}>
          {savedMsg}
        </p>
      ) : null}

      <div className="panel" style={{ marginBottom: '1.1rem' }}>
        <h3>Filters</h3>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="minScore">Min readiness</label>
            <input
              id="minScore"
              type="number"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value) || 0)}
            />
          </div>
          <div className="field">
            <label htmlFor="minFit">Min role-fit</label>
            <input
              id="minFit"
              type="number"
              min={0}
              max={100}
              value={minFit}
              onChange={(e) => setMinFit(Number(e.target.value) || 0)}
            />
          </div>
          <div className="field">
            <label htmlFor="branch">Branch</label>
            <select id="branch" value={branch} onChange={(e) => setBranch(e.target.value)}>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="roleFilter">Target role</label>
            <select id="roleFilter" value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="field full">
            <label htmlFor="skill">Skill / gap contains</label>
            <input
              id="skill"
              value={skillQuery}
              onChange={(e) => setSkillQuery(e.target.value)}
              placeholder="e.g. docker, react, sql"
            />
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <span>Filtered students</span>
          <strong>{filtered.length}</strong>
        </div>
        <div className="stat">
          <span>Average readiness</span>
          <strong>{insights.avg}</strong>
        </div>
        <div className="stat">
          <span>Interview-ready (≥75)</span>
          <strong>{insights.ready}</strong>
        </div>
        <div className="stat">
          <span>At-risk (&lt;55)</span>
          <strong>{insights.atRisk}</strong>
        </div>
      </div>

      <div className="panel-grid">
        <div className="panel">
          <h3>Cohort leaderboard</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Branch</th>
                  <th>Target role</th>
                  <th>Score</th>
                  <th>Role-fit</th>
                  <th>Verified / claimed</th>
                  <th>Top gap</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.branch}</td>
                    <td>{student.targetRole}</td>
                    <td>
                      <strong>{student.readinessScore}</strong>
                    </td>
                    <td>{student.roleFit}</td>
                    <td>
                      {student.verifiedSkills}/{student.claimedSkills}
                    </td>
                    <td>{student.topGap}</td>
                    <td>
                      <span
                        className={
                          student.trend === 'up'
                            ? 'pill good'
                            : student.trend === 'down'
                              ? 'pill bad'
                              : 'pill warn'
                        }
                      >
                        {student.trend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h3>Where the batch needs support</h3>
          <div className="gap-bars">
            {insights.topGaps.map(([gap, count]) => (
              <div className="row" key={gap}>
                <span>{gap}</span>
                <div className="bar">
                  <i
                    style={{
                      width: `${(count / Math.max(filtered.length, 1)) * 100}%`,
                    }}
                  />
                </div>
                <strong>{count}</strong>
              </div>
            ))}
          </div>

          <h4 style={{ marginTop: '1.4rem' }}>Readiness by target role</h4>
          <div className="skill-list">
            {insights.roleAverages.map((row) => (
              <div
                className="skill-row"
                key={row.role}
                style={{ gridTemplateColumns: '1.4fr 0.6fr 0.5fr' }}
              >
                <div className="skill-name" style={{ textTransform: 'none' }}>
                  {row.role}
                </div>
                <div className="hint">{row.count} students</div>
                <strong>{row.avg}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-grid" style={{ marginTop: '1.1rem' }}>
        <div className="panel">
          <h3>Configure scoring weights</h3>
          <p className="hint" style={{ marginBottom: '0.9rem' }}>
            Required by DQWL — placement teams set evidence / project / role / activity / profile
            weightages (auto-normalized to 100%).
          </p>
          {(
            [
              ['evidence', 'Evidence'],
              ['projects', 'Projects'],
              ['roleFit', 'Role fit'],
              ['activity', 'Activity'],
              ['profile', 'Profile'],
            ] as const
          ).map(([key, label]) => (
            <div className="weight-row" key={key}>
              <label htmlFor={`w-${key}`}>
                {label} ({weights[key]}%)
              </label>
              <input
                id={`w-${key}`}
                type="range"
                min={0}
                max={60}
                value={weights[key]}
                onChange={(e) =>
                  setWeights((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                }
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <button type="button" className="btn btn-primary" onClick={persistWeights}>
              Save weights
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setWeights(resetWeights())
                setSavedMsg('Weights reset to defaults.')
              }}
            >
              Reset defaults
            </button>
          </div>
          <p className="hint" style={{ marginTop: '0.65rem' }}>
            Defaults: {DEFAULT_WEIGHTS.evidence}/{DEFAULT_WEIGHTS.projects}/
            {DEFAULT_WEIGHTS.roleFit}/{DEFAULT_WEIGHTS.activity}/{DEFAULT_WEIGHTS.profile}
          </p>
        </div>

        <div className="panel">
          <h3>Configure target job roles</h3>
          <p className="hint" style={{ marginBottom: '0.9rem' }}>
            Enable roles for matching and edit must-have skills used by the scoring engine.
          </p>
          <div className="role-toggles">
            {TARGET_ROLES.map((r) => (
              <label key={r.id} className="toggle-chip">
                <input
                  type="checkbox"
                  checked={roleCfg.enabled.includes(r.id)}
                  onChange={(e) => {
                    const enabled = e.target.checked
                      ? [...new Set([...roleCfg.enabled, r.id])]
                      : roleCfg.enabled.filter((id) => id !== r.id)
                    const next = { ...roleCfg, enabled }
                    setRoleCfg(next)
                    saveRoleConfig(next)
                  }}
                />
                {r.title}
              </label>
            ))}
          </div>
          <div className="field" style={{ marginTop: '1rem' }}>
            <label htmlFor="editRole">Edit must-have skills for</label>
            <select
              id="editRole"
              value={editRoleId}
              onChange={(e) => {
                const id = e.target.value as RoleId
                setEditRoleId(id)
                const override = roleCfg.overrides[id]
                const base = TARGET_ROLES.find((r) => r.id === id)
                setMustHaveText((override?.mustHave ?? base?.mustHave ?? []).join(', '))
              }}
            >
              {TARGET_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="mustHave">Must-have skills (comma-separated)</label>
            <textarea
              id="mustHave"
              value={mustHaveText}
              onChange={(e) => setMustHaveText(e.target.value)}
              style={{ minHeight: 90 }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={persistRoles}>
              Save role requirements
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const next = resetRoleConfig()
                setRoleCfg(next)
                setMustHaveText(
                  TARGET_ROLES.find((r) => r.id === editRoleId)?.mustHave.join(', ') ?? '',
                )
                setSavedMsg('Role config reset.')
              }}
            >
              Reset roles
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
