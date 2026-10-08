import { TARGET_ROLES, type RoleId, type TargetRole } from '../data/roles'

const KEY = 'careerlens:role-config'

export interface RoleConfigState {
  enabled: RoleId[]
  overrides: Partial<Record<RoleId, { mustHave: string[]; niceToHave: string[] }>>
}

function defaultState(): RoleConfigState {
  return {
    enabled: TARGET_ROLES.map((r) => r.id),
    overrides: {},
  }
}

export function loadRoleConfig(): RoleConfigState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as RoleConfigState
    const enabled = parsed.enabled?.length
      ? parsed.enabled
      : TARGET_ROLES.map((r) => r.id)
    return { enabled, overrides: parsed.overrides ?? {} }
  } catch {
    return defaultState()
  }
}

export function saveRoleConfig(state: RoleConfigState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function resetRoleConfig() {
  localStorage.removeItem(KEY)
  return defaultState()
}

/** Roles used by scoring — respects placement-cell config. */
export function getConfiguredRoles(): TargetRole[] {
  const cfg = loadRoleConfig()
  const enabledIds = cfg.enabled.length ? cfg.enabled : TARGET_ROLES.map((r) => r.id)
  const selected = TARGET_ROLES.filter((r) => enabledIds.includes(r.id))
  const list = (selected.length ? selected : TARGET_ROLES).map((role) => {
    const override = cfg.overrides[role.id]
    if (!override) return role
    return {
      ...role,
      mustHave: override.mustHave.length ? override.mustHave : role.mustHave,
      niceToHave: override.niceToHave.length ? override.niceToHave : role.niceToHave,
    }
  })
  return list
}
