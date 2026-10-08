from __future__ import annotations

from typing import Any


def evidence_to_score(count: int) -> int:
    if count <= 0:
        return 0
    if count == 1:
        return 30
    if count == 2:
        return 50
    if count <= 4:
        return 70
    return 90


def status_for(claimed: bool, score: int, evidence: int) -> str:
    if evidence >= 3 and score >= 70:
        return "verified"
    if evidence >= 1 and score >= 40:
        return "partial"
    if claimed:
        return "unverified"
    return "missing"


def build_skill_matrix(
    claimed: list[str],
    role_must: list[str],
    github_hits: dict[str, int],
    project_mentions: list[str],
) -> list[dict[str, Any]]:
    claimed_norm = {c.lower(): c for c in claimed}
    role_norm = {r.lower(): r for r in role_must}
    all_keys = set(claimed_norm) | set(role_norm) | {k.lower() for k in github_hits}

    # map github keys case-insensitively
    gh = {k.lower(): v for k, v in github_hits.items()}
    projects_l = [p.lower() for p in project_mentions]

    rows: list[dict[str, Any]] = []
    for key in sorted(all_keys):
        name = claimed_norm.get(key) or role_norm.get(key) or key.title()
        claimed_flag = key in claimed_norm
        evidence = gh.get(key, 0)
        evidence_notes: list[str] = []
        if evidence:
            evidence_notes.append(f"{evidence} related GitHub repositories/projects")
        if any(key in p for p in projects_l):
            evidence = max(evidence, 1)
            evidence_notes.append("Mentioned in resume project narrative")

        score = evidence_to_score(evidence)
        if claimed_flag and evidence == 0:
            score = 20
        status = status_for(claimed_flag, score, evidence)

        rows.append(
            {
                "name": name,
                "claimed": claimed_flag,
                "evidence": evidence,
                "status": status,
                "score": score,
                "evidence_notes": evidence_notes,
            }
        )

    rows.sort(key=lambda r: (-r["score"], r["name"]))
    return rows
