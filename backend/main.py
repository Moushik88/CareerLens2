"""CareerLens FastAPI — brain + API layer for DataQuest 3.0."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from services.github_analyzer import analyze_github
from services.resume_parser import parse_resume_bytes
from services.scoring import compute_report, load_roles

app = FastAPI(title="CareerLens API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeBody(BaseModel):
    target_role: str = Field(default="Machine Learning Engineer")
    github_username: str
    resume_text: str = ""
    candidate_name: str = "Candidate"
    linkedin: str | None = None
    portfolio: str | None = None


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "CareerLens backend online"}


@app.get("/roles")
def roles() -> dict[str, Any]:
    return load_roles()


@app.post("/analyze/resume")
async def analyze_resume(file: UploadFile = File(...)) -> dict[str, Any]:
    data = await file.read()
    if not data:
        raise HTTPException(400, "Empty file")
    parsed = parse_resume_bytes(data, file.filename or "resume.pdf")
    return {
        "text": parsed.text,
        "method": parsed.method,
        "page_count": parsed.page_count,
        "name": parsed.name,
        "skills": parsed.skills,
        "projects": parsed.projects,
        "warning": parsed.warning,
    }


@app.post("/analyze/github")
async def analyze_github_route(payload: dict[str, str]) -> dict[str, Any]:
    username = payload.get("github_username") or payload.get("username") or ""
    if not username.strip():
        raise HTTPException(400, "github_username required")
    return await analyze_github(username)


@app.post("/analyze")
async def analyze(body: AnalyzeBody) -> dict[str, Any]:
    if not body.resume_text.strip():
        raise HTTPException(400, "resume_text required (upload PDF via /analyze/resume first)")
    if not body.github_username.strip():
        raise HTTPException(400, "github_username required")

    parsed = parse_resume_bytes(body.resume_text.encode("utf-8"), "resume.txt")
    github = await analyze_github(body.github_username)
    sources = 1 + (1 if body.github_username else 0)
    if body.linkedin:
        sources += 1
    if body.portfolio:
        sources += 1

    return compute_report(
        candidate_name=body.candidate_name or parsed.name or "Candidate",
        target_role=body.target_role,
        claimed_skills=parsed.skills,
        projects=parsed.projects,
        github=github,
        sources_count=sources,
    )


@app.post("/analyze/upload")
async def analyze_upload(
    file: UploadFile = File(...),
    github_username: str = Form(...),
    target_role: str = Form("Machine Learning Engineer"),
    candidate_name: str = Form(""),
) -> dict[str, Any]:
    """One-shot: PDF (including scanned) + GitHub + role → full report."""
    data = await file.read()
    parsed = parse_resume_bytes(data, file.filename or "resume.pdf")
    if not parsed.text.strip():
        raise HTTPException(400, parsed.warning or "Could not extract resume text")

    github = await analyze_github(github_username)
    report = compute_report(
        candidate_name=candidate_name or parsed.name or "Candidate",
        target_role=target_role,
        claimed_skills=parsed.skills,
        projects=parsed.projects,
        github=github,
        sources_count=2,
    )
    report["resume_parse"] = {
        "method": parsed.method,
        "page_count": parsed.page_count,
        "warning": parsed.warning,
    }
    return report


@app.post("/roadmap")
async def roadmap(body: AnalyzeBody) -> dict[str, Any]:
    report = await analyze(body)
    return {"roadmap": report["roadmap"], "gaps": report["gaps"]}
