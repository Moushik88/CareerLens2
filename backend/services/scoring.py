from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .skill_engine import build_skill_matrix

ROLES_PATH = Path(__file__).resolve().parent.parent / "data" / "roles.json"


def load_roles() -> dict[str, Any]:
    return json.loads(ROLES_PATH.read_text(encoding="utf-8"))


def clamp(n: float) -> int:
    return max(0, min(100, round(n)))


def compute_report(
    *,
    candidate_name: str,
    target_role: str,
    claimed_skills: list[str],
    projects: list[str],
    github: dict[str, Any],
    sources_count: int,
) -> dict[str, Any]:
    roles = load_roles()
    # fuzzy role key
    role_key = next(
        (k for k in roles if k.lower() == target_role.lower()),
        next((k for k in roles if target_role.lower() in k.lower()), "Machine Learning Engineer"),
    )
    role = roles[role_key]
    must = role["must"]

    skills = build_skill_matrix(
        claimed=claimed_skills,
        role_must=must,
        github_hits=github.get("skill_hits") or {},
        project_mentions=projects,
    )

    role_skills = [s for s in skills if s["name"] in must or s["name"].lower() in {m.lower() for m in must}]
    if not role_skills:
        role_skills = skills[: len(must)] or skills

    evidence = clamp(sum(s["score"] for s in role_skills) / max(len(role_skills), 1))
    projects_score = clamp(
        min(len(projects), 4) * 15
        + min(int(github.get("readme_quality_hits") or 0), 4) * 5
        + min(int(github.get("stars") or 0), 20)
    )
    matched = [s for s in role_skills if s["status"] in ("verified", "partial")]
    role_fit = clamp(len(matched) / max(len(must), 1) * 100)
    activity = clamp(int(github.get("activity_score") or 35))
    profile = clamp(sources_count * 18 + (12 if github.get("ok") else 0))

    overall = clamp(
        evidence * 0.30 + projects_score * 0.25 + role_fit * 0.20 + activity * 0.15 + profile * 0.10
    )

    gaps = []
    for s in skills:
        if s["name"] in must or s["name"].lower() in {m.lower() for m in must}:
            if s["status"] in ("unverified", "missing", "partial"):
                gaps.append(
                    {
                        "skill": s["name"],
                        "priority": "high" if s["status"] in ("unverified", "missing") else "medium",
                        "reason": (
                            "Claimed on resume but weak/no observable evidence"
                            if s["claimed"] and s["evidence"] == 0
                            else "Limited evidence relative to target role"
                        ),
                    }
                )

    roadmap = []
    gap_names = [g["skill"] for g in gaps]
    weeks = ["Week 1", "Week 2", "Week 3", "Week 4"]
    templates = [
        "Strengthen {skill} with 1–2 public projects and a clear README",
        "Build a {skill}-aligned project and document metrics",
        "Deploy one project that uses {skill} (API or demo URL)",
        "Align resume + GitHub storytelling around verified strengths",
    ]
    for i, week in enumerate(weeks):
        skill = gap_names[i] if i < len(gap_names) else "your weakest claim"
        roadmap.append(
            {
                "week": week,
                "title": templates[i].format(skill=skill),
                "actions": [
                    f"Ship visible proof for {skill}",
                    "Keep GitHub activity consistent this week",
                    "Update resume bullets to match the evidence",
                ],
            }
        )

    explanations = [
        (
            f"Why {overall}? Score = 30% evidence ({evidence}) + 25% projects ({projects_score}) "
            f"+ 20% role fit ({role_fit}) + 15% activity ({activity}) + 10% profile ({profile})."
        )
    ]
    for s in [x for x in skills if x["status"] == "verified"][:3]:
        note = s["evidence_notes"][0] if s["evidence_notes"] else "observable evidence found"
        explanations.append(f"{s['name']} is verified ({s['score']}%) — {note}.")
    for g in gaps[:3]:
        explanations.append(f"{g['skill']} needs work — {g['reason']}.")

    return {
        "candidate": {"name": candidate_name or "Candidate", "target_role": role_key},
        "score": {
            "overall": overall,
            "evidence": evidence,
            "projects": projects_score,
            "role_fit": role_fit,
            "activity": activity,
            "profile": profile,
        },
        "skills": skills,
        "gaps": gaps,
        "roadmap": roadmap,
        "explanations": explanations,
        "github": {
            "username": github.get("username"),
            "public_repos": github.get("public_repos"),
            "stars": github.get("stars"),
            "activity_score": github.get("activity_score"),
            "languages": github.get("languages"),
        },
        "tagline": "Don't tell us what you know. Show us the evidence.",
    }
