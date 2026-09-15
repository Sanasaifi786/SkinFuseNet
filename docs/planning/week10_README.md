# SkinFuseNet - Week 10
### Frontend Components — ResultsPanel — ProbabilityChart — GradCAMViewer — ImageUpload polish

> **Phase:** Frontend  
> **Weeks done:** 1 ✅ · 2 ✅ · 3 ✅ · 4 ✅ · 5 ✅ · 6 ✅ · 7 ✅ · 8 ✅ · 9 ✅ · **10 ← you are here**  
> **Time needed:** 10-15 hrs across the week  
> **Prerequisite:** Week 9 complete - backend fully working with error handling

---

## 🔄 Current Status (Updated August 29, 2026)

| Task | Owner | Status |
|---|---|---|
| `ImageUpload.jsx` (drag-drop, validation, preview) | Person A | ✅ **Done** — basic version |
| `DisclaimerBanner.jsx` | Person A | ✅ **Done** |
| `ImageUpload.jsx` accessibility + mobile polish | Person A | ⚠️ **Partially done** — needs UX polish |
| `ResultsPanel.jsx` | Person B | ❌ **Not created** |
| `ProbabilityChart.jsx` | Person C | ❌ **Not created** |
| `GradCAMViewer.jsx` | Person C | ❌ **Not created** |
| `team/week10_review.md` | Team | ❌ **Missing** |

> **Note:** Person A's input components are ready. Person B and C still need to create the result display components.

## Week 10 Goal

All 6 React components built with mock data. Mobile responsive. Consistent visual design. Ready to swap mock data for real API calls in week 11.

---

## Before Day 1

AGREE ON MOCK DATA OBJECT BEFORE BUILDING

All 3 people use the same mock result object for testing:

const MOCK_RESULT = {
  predicted_class: 'MEL',
  confidence: 0.87,
  probabilities: {
    MEL: 0.87, NV: 0.06, BKL: 0.03,
    BCC: 0.02, AKIEC: 0.01, VASC: 0.005, DF: 0.005
  },
  gradcam_image: '[get a real base64 string from Swagger]'
}

Get a real base64 string by running a prediction in Swagger and copying the gradcam_image value. Without a real base64 string, GradCAMViewer cannot be tested.

Also agree on the colour scheme:
- MEL/BCC/AKIEC → red severity badge
- NV/BKL/DF/VASC → green severity badge
- Primary blue: #1565C0
- Predicted class bar in chart: blue, others: gray

---

## Tasks by Person

### Person A — ImageUpload + DisclaimerBanner Polish
**File:** `frontend/src/components/ImageUpload.jsx + DisclaimerBanner.jsx`

**Step by step:**
1. ImageUpload: add onDragEnter/onDragLeave handlers — change border to solid blue and bg to blue-50 when file dragged over
2. Add clear button: small X that appears after image selected — onClick resets preview and calls onFileSelect(null)
3. Show file info below thumbnail: filename and file size in MB
4. Error messages must be specific: 'Please upload a JPEG or PNG image. You selected a PDF file.' not just 'Invalid file type'
5. DisclaimerBanner: position sticky top-0 z-50, yellow background, warning emoji, keeps full width while scrolling
6. Test on Chrome DevTools: toggle device toolbar → iPhone SE (375px). All elements must be usable — buttons large enough to tap, text readable without zooming
7. Drop zone must also work on mobile (tap to select)

**Why this matters:** These are the first things users see. A clear disclaimer builds trust. Good upload UX reduces user frustration. Specific error messages guide users to fix problems themselves.

---

### Person B — ResultsPanel
**File:** `frontend/src/components/ResultsPanel.jsx`

**Step by step:**
1. Define CLASS_INFO object at top of file: maps each class code to full name, severity (high/medium/low), and one-line clinical description
2. Full names: MEL→Melanoma, NV→Melanocytic Nevi, BKL→Benign Keratosis, BCC→Basal Cell Carcinoma, AKIEC→Actinic Keratosis, VASC→Vascular Lesion, DF→Dermatofibroma
3. Severity colours: high→red border+bg, medium→yellow, low→green
4. Show: class full name (large), severity badge, confidence percentage bar, clinical description
5. Include medical disclaimer inside panel: 'This is a research prototype and is NOT a clinical diagnosis.'
6. Test with ALL 7 class codes hardcoded — every single one must display correctly with correct colour
7. Test with confidence=0.05 (very low) and confidence=0.99 (very high) — bar must render correctly at extremes

**Why this matters:** ResultsPanel is the most important visual component — it is what users came to see. High-risk results must look appropriately serious. Low-risk results should feel reassuring. The severity colour system communicates clinical significance at a glance.

---

### Person C — ProbabilityChart + GradCAMViewer
**File:** `frontend/src/components/ProbabilityChart.jsx + GradCAMViewer.jsx`

**Step by step:**
1. ProbabilityChart: import BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer from recharts
2. Sort probabilities descending before rendering
3. Use Cell to give predicted class bar a different fill colour than others
4. Show percentage labels on bars with formatter: v => v.toFixed(1) + '%'
5. Always show all 7 classes even if probability is 0.000 — never hide classes
6. GradCAMViewer: img src MUST be: {'data:image/png;base64,' + props.gradcam_image} — exact prefix, no spaces
7. Add toggle button: show original vs show heatmap. Store toggle state with useState.
8. Side by side on desktop (grid-cols-2), stacked on mobile
9. Test that switching toggle shows both images correctly

**Why this matters:** The probability chart shows users that the AI considered all possibilities, not just the top prediction. GradCAMViewer is the explainability feature that makes SkinFuseNet different from every other skin AI tool.

---

## Daily Breakdown

| Day | Focus | Who |
|-----|-------|-----|
| Mon | Agree on MOCK_RESULT object. Get real base64 from Swagger. Share in team chat. | All 3 together |
| Tue | Each person writes their components using MOCK_RESULT. | Each independently |
| Wed | Each person continues building and doing first visual check. | Each independently |
| Thu | Polish: error messages, edge cases, visual details. | Each independently |
| Fri | Mobile responsiveness: Chrome DevTools iPhone SE 375px. Fix layout issues. | Each independently |
| Sat | All 3: review each other's components. Visual consistency check. | All 3 together |
| Sun | Weekly review. Do all 6 components render correctly with mock data? | All 3 together |

---

## Week 10 Checklist

### Person A
- [ ] ImageUpload: add onDragEnter/onDragLeave handlers — change border to solid blue ...
- [ ] Add clear button: small X that appears after image selected — onClick resets pre...
- [ ] Show file info below thumbnail: filename and file size in MB
- [ ] Error messages must be specific: 'Please upload a JPEG or PNG image. You selecte...
- [ ] DisclaimerBanner: position sticky top-0 z-50, yellow background, warning emoji, ...

### Person B
- [ ] Define CLASS_INFO object at top of file: maps each class code to full name, seve...
- [ ] Full names: MEL→Melanoma, NV→Melanocytic Nevi, BKL→Benign Keratosis, BCC→Basal C...
- [ ] Severity colours: high→red border+bg, medium→yellow, low→green
- [ ] Show: class full name (large), severity badge, confidence percentage bar, clinic...
- [ ] Include medical disclaimer inside panel: 'This is a research prototype and is NO...

### Person C
- [ ] ProbabilityChart: import BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveC...
- [ ] Sort probabilities descending before rendering
- [ ] Use Cell to give predicted class bar a different fill colour than others
- [ ] Show percentage labels on bars with formatter: v => v.toFixed(1) + '%'
- [ ] Always show all 7 classes even if probability is 0.000 — never hide classes

### Team
- [ ] All files committed and pushed to GitHub
- [ ] team/week10_review.md written and committed
- [ ] Each person can explain their week's work to the other two

---

## Common Errors This Week

### Recharts not found
**Fix:** npm install recharts — check you are in the frontend folder when running this

### GradCAM image shows as broken icon
**Fix:** The img src prefix must be exactly 'data:image/png;base64,' with no extra spaces. Also check the base64 string has no whitespace — call .trim() if needed.

### Chart overflows on mobile
**Fix:** Wrap the chart in ResponsiveContainer width='100%'. Do not set a fixed width in pixels.

### Toggle button shows both images at same time
**Fix:** The toggle should conditionally render: {showOverlay ? <img src={gradcam} /> : <img src={original} />} — not render both with one hidden via CSS.

---

## Deliverable

All 6 components built and rendering correctly with MOCK_RESULT. Mobile responsive at 375px. Consistent visual design. Ready for week 11 real API wiring.

---

*SkinFuseNet · Week 10 · All 3 team members*