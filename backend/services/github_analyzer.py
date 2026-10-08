from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx

SKILL_KEYWORDS = {
    "Python": ["python", "django", "flask", "fastapi", "pandas", "numpy"],
    "JavaScript": ["javascript", "js", "node", "express"],
    "TypeScript": ["typescript", "ts"],
    "React": ["react", "next", "jsx", "tsx"],
    "Machine Learning": ["machine-learning", "ml", "scikit", "sklearn", "xgboost"],
    "TensorFlow": ["tensorflow", "keras", "tf-"],
    "PyTorch": ["pytorch", "torch"],
    "SQL": ["sql", "postgres", "mysql", "sqlite"],
    "Docker": ["docker", "dockerfile", "compose"],
    "AWS": ["aws", "lambda", "s3", "ec2"],
    "Deep Learning": ["deep-learning", "neural", "cnn", "transformer"],
    "Deployment": ["deploy", "fastapi", "docker", "vercel"],
    "HTML": ["html"],
    "CSS": ["css", "tailwind"],
    "Git": ["git"],
    "Pandas": ["pandas"],
    "Statistics": ["statistics", "stats"],
}


def parse_username(value: str) -> str:
    value = value.strip().rstrip("/")
    if "github.com" in value:
        return value.split("github.com/")[-1].split("/")[0]
    return value.lstrip("@")


async def analyze_github(username_or_url: str) -> dict[str, Any]:
    username = parse_username(username_or_url)
    async with httpx.AsyncClient(timeout=20.0) as client:
        user_res = await client.get(f"https://api.github.com/users/{username}")
        if user_res.status_code != 200:
            return {
                "username": username,
                "ok": False,
                "error": f"GitHub user not found ({user_res.status_code})",
                "skill_hits": {},
                "languages": {},
                "repos": [],
                "activity_score": 0,
                "stars": 0,
                "public_repos": 0,
            }

        user = user_res.json()
        repos_res = await client.get(
            f"https://api.github.com/users/{username}/repos",
            params={"per_page": 40, "sort": "updated"},
        )
        repos = repos_res.json() if repos_res.status_code == 200 else []

    own = [r for r in repos if isinstance(r, dict) and not r.get("fork")]
    languages: dict[str, int] = {}
    skill_hits: dict[str, int] = {}
    stars = 0
    readme_hits = 0
    now = datetime.now(timezone.utc)

    for repo in own:
        stars += int(repo.get("stargazers_count") or 0)
        lang = (repo.get("language") or "").strip()
        if lang:
            languages[lang] = languages.get(lang, 0) + 1
            skill_hits[lang] = skill_hits.get(lang, 0) + 1

        blob = f"{repo.get('name', '')} {repo.get('description') or ''}".lower()
        if (repo.get("description") and len(repo["description"]) > 40) or int(
            repo.get("size") or 0
        ) > 500:
            readme_hits += 1

        for skill, keys in SKILL_KEYWORDS.items():
            if any(k in blob for k in keys) or (lang and lang.lower() == skill.lower()):
                skill_hits[skill] = skill_hits.get(skill, 0) + 1

    recent = 0
    for repo in own:
        updated = repo.get("updated_at")
        if not updated:
            continue
        dt = datetime.fromisoformat(updated.replace("Z", "+00:00"))
        if (now - dt).days <= 120:
            recent += 1

    activity = min(
        100,
        round((recent / max(len(own), 1)) * 55 + min(len(own), 15) * 2 + min(readme_hits, 8) * 2),
    )

    return {
        "username": username,
        "ok": True,
        "public_repos": user.get("public_repos", len(own)),
        "followers": user.get("followers", 0),
        "languages": languages,
        "skill_hits": skill_hits,
        "stars": stars,
        "activity_score": activity,
        "readme_quality_hits": readme_hits,
        "repos": [
            {
                "name": r.get("name"),
                "language": r.get("language"),
                "stars": r.get("stargazers_count", 0),
                "description": r.get("description"),
            }
            for r in own[:12]
        ],
    }
