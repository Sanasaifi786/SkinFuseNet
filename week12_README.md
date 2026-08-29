# SkinFuseNet - Week 12
### Integration + Docker Compose — 20-item test checklist — Bug fixes — docker-compose.yml

> **Phase:** Integration  
> **Weeks done:** 1 ✅ · 2 ✅ · 3 ✅ · 4 ✅ · 5 ✅ · 6 ✅ · 7 ✅ · 8 ✅ · 9 ✅ · 10 ✅ · 11 ✅ · **12 ← you are here**  
> **Time needed:** 10-15 hrs across the week  
> **Prerequisite:** Week 11 complete - full user journey working with real backend

---

## 🔄 Current Status (Updated August 29, 2026)

| Task | Owner | Status |
|---|---|---|
| 20-point integration test checklist | Person A | ❌ **Not started** |
| `team/integration_checklist.md` | Person A | ❌ **Missing** |
| `team/integration_results.md` | Person A | ❌ **Missing** |
| Bug fixes from integration tests | Person B | ❌ **Not started** |
| `docker-compose.yml` (backend + frontend) | Person C | ❌ **Missing** |
| `frontend/Dockerfile` | Person C | ❌ **Missing** |
| `backend/Dockerfile` | Person A | ❌ **Missing** |
| `team/week12_review.md` | Team | ❌ **Missing** |

> **This entire week is blocked until Weeks 7–11 (real model inference + frontend components) are complete.**

---


## Week 12 Goal

docker-compose up starts the complete app. All 20 integration tests passing. All bugs fixed. team/integration_results.md committed.

---

## Before Day 1

START WITH docker-compose up ON DAY 1

Do not wait until day 4 to try Docker. Start on Day 1:
1. Person C writes docker-compose.yml
2. All 3 run: docker-compose up --build
3. List every error and warning
4. Fix through the week

Most common docker-compose issues:
- Frontend cannot reach backend (URL problem)
- Model file too large for Docker image
- GPU passthrough not configured
- Backend takes 60+ seconds to load model but frontend starts immediately

Expect 2-3 days of debugging. That is normal.

---

## Tasks by Person

### Person A — Integration Testing — 20 Items
**File:** `team/integration_checklist.md`

**Step by step:**
1. Write team/integration_checklist.md with 20 specific, testable items
2. Run all 20 tests. For each: write PASS or FAIL with notes
3. Required tests: probabilities sum to 1.0, GradCAM base64 decodes to visible PNG, all 7 class codes shown correctly in ResultsPanel, loading spinner visible during inference, /health shows model_loaded:true
4. Error tests: wrong file type shows 400 message on screen, >10MB shows 413 message, missing field shows 422 message
5. Performance: inference completes in under 30 seconds
6. GPU test: run nvidia-smi during a request — GPU utilisation should spike
7. Docker test: all above tests passing inside docker-compose
8. Write team/integration_results.md with all 20 results and screenshots

**Why this matters:** Integration testing finds bugs that unit testing misses — things that work in isolation but break when connected. The checklist ensures systematic coverage rather than ad-hoc testing.

---

### Person B — Bug Fixing
**File:** `backend/app/services/inference.py`

**Step by step:**
1. Fix tensor device mismatch: add .to(device) after EVERY tensor creation in inference.py
2. Fix GradCAM base64 whitespace: add .strip() to the base64 decode call
3. Fix probabilities not summing to 1.0: total = sum(probs.values()); probs = {k: v/total for k,v in probs.items()}
4. Fix BERT tokenizer slowness: confirm tokenizer is at module level, loaded once at import time
5. After each fix, re-run the relevant integration test from Person A's checklist to confirm it passes
6. Document each bug and fix in team/bug_fixes.md

**Why this matters:** Backend bugs that only appear during integration (device mismatch, float precision) would have been invisible in unit testing. Fixing them now ensures a clean demo.

---

### Person C — Docker Compose
**File:** `docker-compose.yml`

**Step by step:**
1. Write docker-compose.yml with two services: backend (port 8000) and frontend (port 5173)
2. Backend: nvidia GPU passthrough, MODEL_PATH env var, healthcheck on /health with 60s start_period (model loading takes time)
3. Frontend: depends_on backend with condition: service_healthy
4. CRITICAL: VITE_API_URL=http://localhost:8000 NOT http://backend:8000. Frontend JS runs in the user's BROWSER which cannot resolve Docker internal hostnames.
5. Write frontend/Dockerfile: node:18-alpine, npm install, npm run dev -- --host 0.0.0.0
6. Test: docker-compose up --build. Open localhost:5173. Run a full prediction.
7. If GPU not available: add device fallback in model_loader.py: device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

**Why this matters:** Docker Compose makes the project reproducible — anyone can clone the repo and run the full app with one command. This is essential for demo and for anyone trying to replicate your research.

---

## Daily Breakdown

| Day | Focus | Who |
|-----|-------|-----|
| Mon | C: write docker-compose.yml. All 3: docker-compose up --build. List all errors. | All 3 together |
| Tue | A: write integration_checklist.md with 20 tests. Start running them. | A |
| Wed | B: fix all inference and GradCAM bugs from integration test failures. | B |
| Thu | C: fix Docker networking and healthcheck issues. | C |
| Fri | A: re-run all 20 integration tests. All must pass. | A |
| Sat | All 3: final docker-compose run together. Screenshot every test passing. | All 3 together |
| Sun | Commit integration_results.md. Week 12 complete. | All 3 together |

---

## Week 12 Checklist

### Person A
- [ ] Write team/integration_checklist.md with 20 specific, testable items
- [ ] Run all 20 tests. For each: write PASS or FAIL with notes
- [ ] Required tests: probabilities sum to 1.0, GradCAM base64 decodes to visible PNG,...
- [ ] Error tests: wrong file type shows 400 message on screen, >10MB shows 413 messag...
- [ ] Performance: inference completes in under 30 seconds

### Person B
- [ ] Fix tensor device mismatch: add .to(device) after EVERY tensor creation in infer...
- [ ] Fix GradCAM base64 whitespace: add .strip() to the base64 decode call
- [ ] Fix probabilities not summing to 1.0: total = sum(probs.values()); probs = {k: v...
- [ ] Fix BERT tokenizer slowness: confirm tokenizer is at module level, loaded once a...
- [ ] After each fix, re-run the relevant integration test from Person A's checklist t...

### Person C
- [ ] Write docker-compose.yml with two services: backend (port 8000) and frontend (po...
- [ ] Backend: nvidia GPU passthrough, MODEL_PATH env var, healthcheck on /health with...
- [ ] Frontend: depends_on backend with condition: service_healthy
- [ ] CRITICAL: VITE_API_URL=http://localhost:8000 NOT http://backend:8000. Frontend J...
- [ ] Write frontend/Dockerfile: node:18-alpine, npm install, npm run dev -- --host 0....

### Team
- [ ] All files committed and pushed to GitHub
- [ ] team/week12_review.md written and committed
- [ ] Each person can explain their week's work to the other two

---

## Common Errors This Week

### Frontend shows 'Network Error' inside Docker
**Fix:** VITE_API_URL is set to http://backend:8000 (Docker hostname). The browser cannot resolve this. Change to http://localhost:8000.

### Backend healthcheck fails — container restarts
**Fix:** The model takes 60+ seconds to load. Set start_period: 60s in the healthcheck. Without this, Docker marks the backend as unhealthy before it finishes loading.

### docker-compose: GPU runtime not found
**Fix:** Install nvidia-container-toolkit on host: sudo apt-get install nvidia-container-toolkit. Then restart Docker: sudo systemctl restart docker.

### 'Cannot find module' errors in frontend container
**Fix:** node_modules/ was not installed inside the container. Ensure Dockerfile runs npm install before COPY . .  — or add node_modules to .dockerignore and run npm install in Dockerfile.

---

## Deliverable

docker-compose up starts both services. All 20 integration tests pass. team/integration_results.md committed.

---

*SkinFuseNet · Week 12 · All 3 team members*