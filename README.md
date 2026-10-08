# CareerLens

**Don't tell us what you know. Show us the evidence.**

AI-powered employability & career-readiness analyzer for **DataQuest 3.0 (DQWL)**.

## What it does

1. **Resume upload** — PDF (text *or scanned via OCR*), DOCX, TXT, MD  
2. **Multi-source links** — GitHub, LinkedIn, Behance, Figma, Dribbble, portfolio, LeetCode, Kaggle, HackerRank, certificates  
3. **LinkedIn details** — paste export / public notes when API access isn’t available  
4. **Claim → Evidence engine** — verified / partial / unverified  
5. **Explainable Job Readiness Score** with **configurable weights** (placement cell)  
6. **Activity & Consistency Score** + **strengths radar chart**  
7. **Skill gaps + 30-day roadmap** (actions + course suggestions) against multiple target roles  
8. **AI resume & portfolio feedback** + rewrite suggestions  
9. **Progress dashboard** — readiness history over re-runs  
10. **Mock interview coach** tailored to the student’s own projects/gaps  
11. **Placement cell** — filters, batch insights, weight + role configuration  

## Quick start (frontend — works standalone)

```bash
cd "C:\Users\MOUSHIK S\CareerLens"
npm install
npm run dev
```

Open http://localhost:5173 → **Analyze** → upload PDF/DOCX or **Load Arjun demo** → **ANALYZE PROFILE**.

### Scanned PDFs

The browser extracts the PDF text layer first. If it looks empty/scanned, it runs **Tesseract.js OCR** on the first pages (20–60s). Clearer scans work better.

## Backend (FastAPI) — optional / for your API layer

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Health check: http://127.0.0.1:8000/health

Vite proxies `/api` → `127.0.0.1:8000` when the backend is running.

## Demo script (judges)

1. Meet **Arjun** — resume claims Python, TensorFlow, SQL, React, ML  
2. Target: **ML / AI Engineer**  
3. Click **ANALYZE PROFILE**  
4. Show **radar**, **Claim → Evidence**, **Why this score**, **AI feedback**, **roadmap**  
5. Open **Interview** coach + **Progress** dashboard  
6. **Placement Cell** — filter cohort, change score weights, edit role must-haves, re-analyze  

Pitch line: *The student isn't judged on what they claim — they're judged on what they can demonstrate.*
