# SkinFuseNet — Week 13
### Polish, Demo & Submission · Final README · Demo video · Deployment · v1.0.0 release

> **Phase:** Final  
> **Weeks done:** 1 ✅ · 2 ✅ · 3 ✅ · 4 ✅ · 5 ✅ · 6 ✅ · 7 ✅ · 8 ✅ · 9 ✅ · 10 ✅ · 11 ✅ · 12 ✅ · **13 ← you are here**  
> **Time needed:** 10–15 hrs across the week  
> **Prerequisite:** Week 12 complete — all 20 integration tests passing, docker-compose working

---

## 🔄 Current Status (Updated August 29, 2026)

| Task | Owner | Status |
|---|---|---|
| `README.md` updated with real measured results | Person A | ❌ **Not done** — placeholder numbers still in README |
| GitHub `v1.0.0` tag + release | Person A | ❌ **Not done** |
| Deployment (Hugging Face Spaces / Render) | Person B | ❌ **Not started** |
| Live demo URL | Person B | ❌ **Missing** |
| Demo video (3-5 min, YouTube unlisted) | Person C | ❌ **Not recorded** |
| Demo video link in README | Person C | ❌ **Missing** |
| `team/week13_review.md` | Team | ❌ **Missing** |

> **This entire week is blocked until Weeks 7–12 are complete.**  
> **Current overall project completion: ~45%**

---

## Week 13 Goal

Public demo URL live. Demo video published and linked. README updated with real results. GitHub repo tagged v1.0.0. Project complete.

---

## Before Day 1

DIVIDE THE THREE TASKS CLEARLY ON DAY 1

Person A: owns the README and the GitHub release
Person B: owns deployment (getting a live URL)
Person C: owns the demo video

All three are independent this week — no blocking dependencies.
The only coordination point is Day 6: all 3 review each other's work before final commit.

Realistic expectations:
- Deployment on Hugging Face Spaces may take 2-3 days of debugging — start Day 1
- Demo video takes 2 takes minimum — do not start recording on Day 6
- README review needs all 3 present — schedule the Day 6 session in advance

---

## Tasks by Person

### Person A — Final README + v1.0.0 Release
**File:** `README.md`

**Step by step:**
1. Replace all placeholder numbers with real results from team/ablation_results.md and team/final_results.md
2. Update progress tracker: tick every completed item
3. Add demo URL (from Person B) under a Demo section
4. Add demo video link (from Person C)
5. Test setup instructions: ask someone who has NOT seen the project to follow the README and set it up. Fix anything confusing.
6. Grammar and spelling check — read every line out loud
7. Final commit: git add . → git commit -m 'release: v1.0.0 — SkinFuseNet complete'
8. Tag: git tag -a v1.0.0 -m 'Final Year Project SkinFuseNet v1.0.0'
9. Push: git push origin main --tags

**Why this matters:** The README is the first thing anyone sees when they visit your GitHub repo — supervisors, examiners, potential employers. A polished README with real results signals a serious, complete project.

---

### Person B — Deployment
**File:** `Hugging Face Spaces deployment`

**Step by step:**
1. Create account at huggingface.co
2. New Space → choose Docker SDK → name it 'skinfusenet'
3. The Space builds from your GitHub repo's main branch automatically after linking
4. Common issue: skinfusenet.pt is too large for normal git. Upload it separately: huggingface-cli upload your-username/skinfusenet backend/models/skinfusenet.pt models/skinfusenet.pt
5. Set environment variables in Space settings: MODEL_PATH=/app/models/skinfusenet.pt
6. If GPU quota exceeded on free tier: deploy backend to render.com (free, CPU), frontend to vercel.com (free)
7. For Render: create Web Service → connect GitHub → set build command 'pip install -r requirements.txt' → set start command 'uvicorn app.main:app --host 0.0.0.0 --port $PORT'
8. Test live URL with 3 real images. Share URL with Person A for README.

**Why this matters:** A live demo URL makes your project tangible. Examiners who cannot run the project locally can still see it working. It also makes the project shareable for future opportunities.

---

### Person C — Demo Video
**File:** `YouTube demo video`

**Step by step:**
1. Write the full script before recording — know exactly what to say at each moment
2. Script timing: 0:00 problem + stats (30s), 0:30 show app (15s), 0:45 upload image (30s), 1:15 fill metadata (15s), 1:30 explain pipeline while loading (60s), 2:30 show results (60s), 3:30 highlight GradCAM + ABCD alignment (30s), 4:00 conclusion (15s)
3. Practice the script out loud twice before recording
4. Record with OBS Studio (free) or Windows Game Bar (Win+G → Record)
5. Record at 1080p. Use screen capture of full browser window.
6. Speak clearly and at a moderate pace — pretend explaining to your professor
7. Do at least 2 takes. Watch both and pick the better one.
8. Trim pauses in DaVinci Resolve (free) or Windows Video Editor
9. Upload to YouTube → Unlisted. Copy URL. Share with Person A for README.

**Why this matters:** A well-recorded demo video is more persuasive than any amount of written description. Showing the GradCAM heatmap highlighting clinically relevant lesion features in real-time is the strongest argument for your project's value.

---

## Daily Breakdown

| Day | Focus | Who |
|-----|-------|-----|
| Mon | A: start README update. B: create HF Spaces account and push. C: write demo script. | Each independently |
| Tue | A: test setup instructions on fresh machine. B: debug deployment issues. C: practice script. | Each independently |
| Wed | A: finish README. B: continue deployment. C: record first take. | Each independently |
| Thu | B: live URL should be working. C: record final take, start editing. | B delivers URL · C records |
| Fri | A: add demo URL and video link to README. C: upload video. | A + C |
| Sat | All 3: review README, watch demo video, check live URL together. | All 3 together |
| Sun | Final commit. Tag v1.0.0. Project complete. 🎉 | All 3 together |

---

## Week 13 Checklist

### Person A
- [ ] Replace all placeholder numbers with real results from team/ablation_results.md ...
- [ ] Update progress tracker: tick every completed item
- [ ] Add demo URL (from Person B) under a Demo section
- [ ] Add demo video link (from Person C)
- [ ] Test setup instructions: ask someone who has NOT seen the project to follow the ...

### Person B
- [ ] Create account at huggingface.co
- [ ] New Space → choose Docker SDK → name it 'skinfusenet'
- [ ] The Space builds from your GitHub repo's main branch automatically after linking
- [ ] Common issue: skinfusenet.pt is too large for normal git. Upload it separately: ...
- [ ] Set environment variables in Space settings: MODEL_PATH=/app/models/skinfusenet....

### Person C
- [ ] Write the full script before recording — know exactly what to say at each moment
- [ ] Script timing: 0:00 problem + stats (30s), 0:30 show app (15s), 0:45 upload imag...
- [ ] Practice the script out loud twice before recording
- [ ] Record with OBS Studio (free) or Windows Game Bar (Win+G → Record)
- [ ] Record at 1080p. Use screen capture of full browser window.

### Team
- [ ] All files committed and pushed to GitHub
- [ ] team/week13_review.md written and committed
- [ ] Each person can explain their week's work to the other two

---

## Common Errors This Week

### HF Spaces build fails: model not found
**Fix:** The .pt file must be accessible at the path specified in MODEL_PATH. Upload it via huggingface-cli or the web UI, not git push.

### Render deployment: port binding error
**Fix:** Render uses a dynamic $PORT environment variable. Start command must use --port $PORT not --port 8000.

### Demo video audio is unclear
**Fix:** Re-record with a quiet environment. If no microphone available, add auto-generated captions in YouTube Studio after uploading.

### git push --tags fails
**Fix:** If tags already exist remotely: git push origin v1.0.0 --force. Make sure the tag name is unique.

---

## Deliverable

Live demo URL. Demo video (3-5 mins) published and linked. README final with real numbers. v1.0.0 tagged on GitHub. Project complete. 🎉

---

*SkinFuseNet · Week 13 · All 3 team members*