# SkinFuseNet — Week 9
### Backend Polish · Error handling · GradCAM hardening · Pydantic schemas · Dockerfile

> **Phase:** Backend  
> **Weeks done:** 1 ✅ · 2 ✅ · 3 ✅ · 4 ✅ · 5 ✅ · 6 ✅ · 7 ✅ · 8 ✅ · **9 ← you are here**  
> **Time needed:** 10–15 hrs across the week  
> **Prerequisite:** Week 8 complete — real predictions working from POST /predict

---

## Week 9 Goal

Every error case returns correct HTTP code and clear English message. GradCAM verified for all 7 classes with fallback. Dockerfile builds and API works inside Docker.

---

## Before Day 1

DELIBERATE FAILURE TESTING

The best way to build good error handling is to try to break the system.
On Day 1, all 3 people independently try to break the API:
- Upload a PDF
- Upload a 50MB image
- Send age = -5
- Send sex = 'other'
- Send localization = 'xyz'
- Send a completely empty request
- Send a 1x1 pixel image

Write down every error you get. Any unclear error = Person A fixes it this week.

---

## Tasks by Person

### Person A — Error Handling + Dockerfile
**File:** `backend/app/routers/predict.py + backend/Dockerfile`

**Step by step:**
1. List all failure modes from Day 1 testing
2. Add specific HTTPException for each: 400 wrong file type, 413 too large, 400 invalid age, 400 invalid sex, 400 invalid localization, 503 model not loaded, 500 inference crash
3. Error messages must be in plain English, not technical. 'Only JPEG and PNG images are accepted. You uploaded a PDF file.' not 'content_type validation failed'
4. Test every error deliberately in Swagger. Screenshot each response.
5. Write backend/Dockerfile: FROM python:3.12-slim, WORKDIR /app, COPY requirements.txt, RUN pip install, COPY app/ and models/, EXPOSE 8000, CMD uvicorn
6. Build: docker build -t skinfusenet-backend .
7. Run: docker run -p 8000:8000 skinfusenet-backend
8. Test API works inside Docker by opening http://localhost:8000/docs

**Why this matters:** Good error handling is what separates a research prototype from a trustworthy application. A user who uploads a PDF and gets a 500 Internal Server Error has no idea what they did wrong. Clear error messages guide them to success.

---

### Person B — GradCAM Hardening
**File:** `backend/app/services/inference.py (GradCAM section)`

**Step by step:**
1. Find one test image for each of the 7 lesion classes in HAM10000 test set
2. Run inference for each — decode the base64 string and open the resulting PNG
3. MEL heatmap should focus on irregular border and asymmetric colour regions
4. NV heatmap should focus on central pigment network
5. If any heatmap is blank white or all one colour — target layer is wrong
6. Add try-except fallback around all GradCAM code: if anything fails, return original image as base64
7. Tune overlay alpha between 0.3 and 0.6 for best visual clarity
8. Test fallback works: temporarily comment out GradCAM code, verify fallback returns valid base64 PNG

**Why this matters:** GradCAM is a key selling point of SkinFuseNet — it is what makes the AI explainable. A blank heatmap would undermine the entire explainability claim. Testing all 7 classes ensures the heatmap is meaningful across the full diagnostic range.

---

### Person C — Pydantic Schemas with Validators
**File:** `backend/app/schemas/predict.py`

**Step by step:**
1. Add ge=1, le=120 constraints to age field
2. Add Literal['male', 'female'] type to sex field — Pydantic will reject anything else automatically
3. Add custom validator for localization: must be one of exactly 13 valid strings
4. Add validator to PredictionResponse: probabilities must have exactly 7 keys matching CLASS_CODES
5. Add validator: confidence must be ge=0.0, le=1.0
6. Add Field descriptions and examples to every field — these appear in Swagger /docs
7. Test validators: create valid and invalid PredictionResponse objects in Python. Valid must succeed, invalid must raise ValidationError.
8. Open http://localhost:8000/docs and verify every field shows its description and example

**Why this matters:** Pydantic validators catch data errors at the schema level before they can cause confusing errors deeper in the inference pipeline. They also auto-generate clear validation error messages — you get 'age must be between 1 and 120' for free.

---

## Daily Breakdown

| Day | Focus | Who |
|-----|-------|-----|
| Mon | All 3: deliberately break the API in as many ways as possible. List all unclear errors. | All 3 together |
| Tue | A: add error handling for all cases found Day 1. C: add Pydantic validators. | A + C independently |
| Wed | B: test GradCAM for all 7 lesion classes. Add fallback. | B |
| Thu | A: write Dockerfile. Build and test. C: add Swagger descriptions. | A + C independently |
| Fri | All 3: test API with Dockerfile. Fix any container issues. | All 3 together |
| Sat | Commit all changes. Verify Swagger /docs looks clean. | All 3 |
| Sun | Weekly review. Is the backend production-quality? | All 3 together |

---

## Week 9 Checklist

### Person A
- [ ] List all failure modes from Day 1 testing
- [ ] Add specific HTTPException for each: 400 wrong file type, 413 too large, 400 inv...
- [ ] Error messages must be in plain English, not technical. 'Only JPEG and PNG image...
- [ ] Test every error deliberately in Swagger. Screenshot each response.
- [ ] Write backend/Dockerfile: FROM python:3.12-slim, WORKDIR /app, COPY requirements...

### Person B
- [ ] Find one test image for each of the 7 lesion classes in HAM10000 test set
- [ ] Run inference for each — decode the base64 string and open the resulting PNG
- [ ] MEL heatmap should focus on irregular border and asymmetric colour regions
- [ ] NV heatmap should focus on central pigment network
- [ ] If any heatmap is blank white or all one colour — target layer is wrong

### Person C
- [ ] Add ge=1, le=120 constraints to age field
- [ ] Add Literal['male', 'female'] type to sex field — Pydantic will reject anything ...
- [ ] Add custom validator for localization: must be one of exactly 13 valid strings
- [ ] Add validator to PredictionResponse: probabilities must have exactly 7 keys matc...
- [ ] Add validator: confidence must be ge=0.0, le=1.0

### Team
- [ ] All files committed and pushed to GitHub
- [ ] team/week9_review.md written and committed
- [ ] Each person can explain their week's work to the other two

---

## Common Errors This Week

### Docker: nvidia runtime not found
**Fix:** For GPU passthrough in Docker, nvidia-container-toolkit must be installed on host. Run: nvidia-container-cli -k -d /dev/tty info. If this fails, Docker GPU passthrough is not set up.

### Docker: model file too large
**Fix:** The .pt file may be too large to include in the Docker image directly. Alternatives: mount it as a volume, or download it at container startup from a cloud storage URL.

### Pydantic v2 validator syntax differs from v1
**Fix:** In Pydantic v2, use @field_validator and @classmethod. The v1 @validator decorator still works but shows deprecation warnings.

### Swagger shows 'string' for localization with no validation hint
**Fix:** Add JSON schema extras: localization: str = Field(..., description='One of: back, face, trunk...', examples=['back'])

---

## Deliverable

All error cases tested with correct HTTP codes and clear messages. GradCAM verified for all 7 classes with fallback. backend/Dockerfile tested. Swagger /docs shows clean documentation.

---

*SkinFuseNet · Week 9 · All 3 team members*