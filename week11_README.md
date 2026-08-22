# SkinFuseNet — Week 11
### Frontend Integration · Wire real API · Loading states · Final layout

> **Phase:** Frontend  
> **Weeks done:** 1 ✅ · 2 ✅ · 3 ✅ · 4 ✅ · 5 ✅ · 6 ✅ · 7 ✅ · 8 ✅ · 9 ✅ · 10 ✅ · **11 ← you are here**  
> **Time needed:** 10–15 hrs across the week  
> **Prerequisite:** Week 10 complete — all 6 components built with mock data

---

## Week 11 Goal

Full user journey working end to end with real model: upload → metadata → analyse → prediction + GradCAM displayed. Loading states polished. All error messages tested.

---

## Before Day 1

VERIFY BACKEND IS RUNNING BEFORE TOUCHING FRONTEND

Before writing any axios code:
1. Start the backend: uvicorn app.main:app --reload --port 8000
2. Open http://localhost:8000/health — must show model_loaded: true
3. Open http://localhost:8000/docs and run one prediction with a real image
4. Copy the full JSON response — you will need the real gradcam_image base64 to test GradCAMViewer

If the backend is not working, do not touch frontend code. Fix the backend first.

---

## Tasks by Person

### Person A — Axios Calls + Error Mapping
**File:** `frontend/src/api/predict.js + frontend/src/hooks/usePrediction.js`

**Step by step:**
1. predict.js: build FormData — form.append('image', imageFile), form.append('age', age), form.append('sex', sex), form.append('localization', localization)
2. CRITICAL: do NOT set Content-Type header manually. Axios sets it with correct boundary automatically. Manual setting breaks multipart parsing in FastAPI.
3. usePrediction.js: update error mapping — map specific HTTP codes and detail strings to friendly messages
4. 400 → 'Only JPEG and PNG images are accepted'
5. 413 → 'Your image is too large. Please use an image under 10MB'
6. 422 → 'Please fill in all fields before analysing'
7. 500 → 'Analysis failed. Please try again in a moment'
8. No response → 'Could not connect to the server. Is it running?'
9. Test all 5 error scenarios from the frontend. Verify each shows the correct friendly message on screen.
10. Test 5 real HAM10000 images end to end. Note prediction and confidence for each.

**Why this matters:** The axios layer is the connection between frontend and backend. Getting FormData right is critical — multipart file upload has strict formatting requirements that axios handles automatically but manual headers break.

---

### Person B — Loading States
**File:** `frontend/src/components/LoadingState.jsx`

**Step by step:**
1. Create LoadingState.jsx with: rotating messages every 2 seconds, spinner animation, 'takes 5-10 seconds' note
2. Messages: 'Preprocessing image...' → 'Running analysis...' → 'Generating explanation...' → 'Almost done...'
3. Use setInterval in useEffect, clear interval when isLoading becomes false
4. Spinner: CSS animation with border-t-blue-600 that rotates using animate-spin (Tailwind built-in)
5. In App.jsx: show LoadingState when loading=true, hide when false
6. Auto-scroll: after result arrives, scrollIntoView on the results div
7. Test: check the spinner appears immediately on click and disappears when result loads
8. Test: check messages rotate every 2 seconds during the wait

**Why this matters:** 5-10 seconds without visual feedback makes users think the app is broken. Rotating messages set expectations and make the wait feel shorter. Auto-scroll ensures users see their results without manually scrolling.

---

### Person C — Final Layout + Polish
**File:** `frontend/src/App.jsx + frontend/src/pages/Home.jsx`

**Step by step:**
1. Desktop layout: CSS grid with grid-cols-1 lg:grid-cols-2. Left: upload + form + button. Right: loading + results.
2. Mobile: grid-cols-1 — everything stacks vertically. Test at 375px.
3. Add smooth fade-in when results appear: transition-all duration-300 opacity-0 to opacity-100
4. Try another image button: calls reset() from usePrediction, clears imageFile state, clears metadata state, scrolls to top
5. Visual consistency pass: check all 6 components use the same font size, border radius, shadow, spacing
6. Cross-browser: test in Chrome (primary), Firefox (layout), Edge (base64 rendering)
7. Fix any rendering differences found in Firefox or Edge
8. Final check: does the full journey feel smooth? Upload → loading → results → try again?

**Why this matters:** The final layout is what users experience. A well-assembled app with consistent design feels trustworthy. Small details like fade-in animations and scroll behaviour make the difference between a project that works and a project that impresses.

---

## Daily Breakdown

| Day | Focus | Who |
|-----|-------|-----|
| Mon | Confirm backend is running and returning real predictions before touching frontend. | All 3 |
| Tue | A: write predict.js and usePrediction.js with real axios calls. | A |
| Wed | B: write LoadingState.jsx. Test spinner and rotating messages. | B |
| Thu | C: assemble final App.jsx layout. Wire all components together. | C |
| Fri | A: test all 5 error scenarios from frontend. Verify friendly messages. | A |
| Sat | All 3: run full end-to-end flow together. Test in Chrome, Firefox, Edge. | All 3 together |
| Sun | Weekly review. Does the full journey feel smooth and professional? | All 3 together |

---

## Week 11 Checklist

### Person A
- [ ] predict.js: build FormData — form.append('image', imageFile), form.append('age',...
- [ ] CRITICAL: do NOT set Content-Type header manually. Axios sets it with correct bo...
- [ ] usePrediction.js: update error mapping — map specific HTTP codes and detail stri...
- [ ] 400 → 'Only JPEG and PNG images are accepted'
- [ ] 413 → 'Your image is too large. Please use an image under 10MB'

### Person B
- [ ] Create LoadingState.jsx with: rotating messages every 2 seconds, spinner animati...
- [ ] Messages: 'Preprocessing image...' → 'Running analysis...' → 'Generating explana...
- [ ] Use setInterval in useEffect, clear interval when isLoading becomes false
- [ ] Spinner: CSS animation with border-t-blue-600 that rotates using animate-spin (T...
- [ ] In App.jsx: show LoadingState when loading=true, hide when false

### Person C
- [ ] Desktop layout: CSS grid with grid-cols-1 lg:grid-cols-2. Left: upload + form + ...
- [ ] Mobile: grid-cols-1 — everything stacks vertically. Test at 375px.
- [ ] Add smooth fade-in when results appear: transition-all duration-300 opacity-0 to...
- [ ] Try another image button: calls reset() from usePrediction, clears imageFile sta...
- [ ] Visual consistency pass: check all 6 components use the same font size, border r...

### Team
- [ ] All files committed and pushed to GitHub
- [ ] team/week11_review.md written and committed
- [ ] Each person can explain their week's work to the other two

---

## Common Errors This Week

### 422 Unprocessable Entity on every request
**Fix:** You are manually setting Content-Type header in axios. Remove it. axios.post(url, formData) with no headers object — axios sets multipart/form-data with correct boundary automatically.

### CORS error in browser console
**Fix:** Backend CORS middleware must include 'http://localhost:5173' in allow_origins. Check app.main.py. Also check that the frontend is actually running on port 5173 and not 3000.

### Results not appearing after prediction
**Fix:** The result object from usePrediction might have a different structure than what the component expects. console.log(result) in App.jsx to see the real structure.

### Try again does not clear the image preview
**Fix:** The ImageUpload component shows a preview from URL.createObjectURL(file). Resetting imageFile state to null does not automatically clear the preview — you need to also reset internal state in ImageUpload. Add a resetKey prop that changes, triggering ImageUpload to re-mount.

---

## Deliverable

Full end-to-end flow with real model. All error messages showing correctly. Loading states polished. App tested in Chrome, Firefox, Edge. Mobile responsive.

---

*SkinFuseNet · Week 11 · All 3 team members*