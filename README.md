# ResuFit - Requirement Gap Analysis Feature

AI-powered requirement gap analysis engine that compares target Job Descriptions against candidate Resume Chunks using the official **OpenAI Node SDK** (`gpt-4o-mini` with `response_format: { type: 'json_object' }`), exposed through an **Express TypeScript backend** and rendered with a high-fidelity **Next.js React visual matrix and checklist component** directly alongside the match score.

---

## Architecture Overview

- **Backend (`/backend`)**:
  - Express with TypeScript (`NodeNext` modules).
  - Route: `POST /api/gap-analysis` (implemented in `src/routes/gapAnalysis.ts`).
  - Integration: Official OpenAI Node SDK using model `gpt-4o-mini` and `response_format: { type: 'json_object' }`.
  - Payloads:
    - Request: `{ "job_description": "...", "resume_chunks": ["chunk 1", "chunk 2", ...] }`
    - Response strictly includes: `matched_skills`, `missing_mandatory_skills`, and `nice_to_haves`, plus `match_score` and ATS summary.
  - Fallback: Intelligent heuristic engine that seamlessly activates if `OPENAI_API_KEY` is not provided or in offline demo environments.
- **Frontend (`/frontend`)**:
  - Next.js 14 App Router with React and TypeScript.
  - Core Component: `<GapAnalysisMatrix data={analysisResult} />` in `src/components/GapAnalysisMatrix.tsx`.
  - Visual Score Card: `<MatchScoreCard data={analysisResult} />` featuring circular SVG gauge, percentage metrics, and mandatory coverage progress.
  - Interactive Matrix & Checklist:
    - Filters by tab (All, Matched, Missing Mandatory, Nice-to-Haves) and category.
    - Real-time search by keyword, skill name, evidence quote, or recommendation.
    - Toggle between Checklist View and Matrix Table View.
    - Expandable drawers displaying direct resume evidence quotes and chunk indices.
    - 3 preloaded industry test scenarios (Senior Full-Stack, AI Systems Engineer, DevOps Cloud Architect).

---

## Quick Start

### 1. Install Dependencies
```bash
# Install root orchestration tools
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment Variables (Optional)
To use live OpenAI `gpt-4o-mini` analysis, add your OpenAI API key in `backend/.env`:
```env
PORT=5001
OPENAI_API_KEY=sk-...
```
*(If left blank, ResuFit runs in high-fidelity local fallback mode with deterministic keyword and semantic matching)*

### 3. Run Development Servers
From the root directory:
```bash
npm run dev
```
Or start individually:
```bash
# Terminal 1: Express TypeScript Backend (port 5001)
cd backend && npm run dev

# Terminal 2: Next.js Frontend (port 3000)
cd frontend && npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## API Specification

### `POST /api/gap-analysis`

**Request Body:**
```json
{
  "job_description": "Full text of target job description...",
  "resume_chunks": [
    "Alex Rivera - Lead Developer with 6 years experience in TypeScript, React, and Node.js...",
    "Built scalable microservices using Express and PostgreSQL, containerized with Docker...",
    "Frontend development with React, state management, and modern UI tooling..."
  ]
}
```

**Response (`200 OK`):**
```json
{
  "matched_skills": [
    {
      "skill": "TypeScript",
      "category": "Languages",
      "resume_evidence": "Results-oriented Full-Stack Engineer with 6+ years specializing in TypeScript",
      "confidence": 0.95,
      "chunk_index": 1
    }
  ],
  "missing_mandatory_skills": [
    {
      "skill": "Kubernetes",
      "category": "DevOps & Cloud",
      "impact": "high",
      "recommendation": "Add verifiable production projects or certifications showcasing Kubernetes cluster management."
    }
  ],
  "nice_to_haves": [
    {
      "skill": "Next.js",
      "category": "Frontend",
      "status": "matched",
      "resume_evidence": "Familiarity with Next.js SSR workflows",
      "bonus_value": "high"
    }
  ],
  "match_score": 82,
  "summary": "Candidate displays exceptional alignment with core backend and frontend requirements...",
  "stats": {
    "total_mandatory": 6,
    "matched_mandatory": 5,
    "total_nice_to_have": 4,
    "matched_nice_to_have": 2,
    "mandatory_coverage_pct": 83
  },
  "analyzed_at": "2026-09-11T00:20:00.000Z"
}
```
