# SkinFuseNet — Week 8
### Backend Real Inference · Load real model · Inference service · Preprocessing service · Router update

> **Phase:** Backend  
> **Weeks done:** 1 ✅ · 2 ✅ · 3 ✅ · 4 ✅ · 5 ✅ · 6 ✅ · 7 ✅ · **8 ← you are here**  
> **Time needed:** 10–15 hrs across the week  
> **Prerequisite:** Week 7 complete — skinfusenet.pt in backend/models/, ablation results committed

---

## 🔄 Current Status (Updated August 29, 2026)

| Task | Owner | Status |
|---|---|---|
| `/predict` router (mock response) | Person A | ✅ **Done** — validation, schemas, mock response |
| `backend/app/services/inference.py` (real model) | Person B | ❌ **Empty** — not started |
| `backend/app/services/preprocess.py` (image to tensor) | Person C | ❌ **Empty** — not started |
| `backend/app/core/model_loader.py` (singleton loader) | Person C | ❌ **Empty** — not started |
| `backend/app/services/image_utils.py` | Team | ❌ **Empty** — not started |
| Router wired to real `run_inference()` | Person A | ❌ **Blocked** — needs inference.py first |
| Tested with 5 real HAM10000 images | Person A | ❌ **Blocked** |
| `team/week8_review.md` | Team | ❌ **Missing** |

> **Note:** The mock router and validation are complete. This week's goal is replacing the mock response with real inference.

## Week 8 Goal

POST /predict returns real model predictions with real GradCAM heatmap. Tested with 5 real HAM10000 test images. Probabilities sum to ~1.0.

---

## Before Day 1

BUILD ORDER THIS WEEK: C → B → A

Person C builds preprocess.py first.
Person B builds inference.py using Person C's preprocess_image() function.
Person A updates the router to call Person B's run_inference() function.

Do not skip the order. If A tries to wire the router before B has inference.py, the router has nothing to call.

---

## Tasks by Person

### Person C — Inference-Time Image Preprocessing
**File:** `backend/app/services/preprocess.py`

**Step by step:**
1. Function: preprocess_image(image_bytes: bytes) → FloatTensor [1,3,256,256]
2. Step 1: decode bytes → PIL Image: Image.open(io.BytesIO(image_bytes)).convert('RGB')
3. Step 2: convert to numpy RGB array: np.array(pil_image)
4. Step 3: apply CLAHE — same code as ml/src/preprocess/clahe.py (copy the function)
5. Step 4: convert back to PIL Image: Image.fromarray(enhanced)
6. Step 5: apply transforms: Resize(256,256) → ToTensor() → Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
7. Step 6: add batch dimension: tensor.unsqueeze(0) → [1,3,256,256]
8. Test: read a real HAM10000 image as bytes, run through function, verify shape [1,3,256,256] and value range approx -3 to 3
9. Commit. Tell Person B it is ready.

**Why this matters:** The model was trained on images that went through SAM + CLAHE + normalisation. At inference time we must apply the exact same transforms in the same order. Different preprocessing = the model sees inputs unlike anything in training = unreliable predictions.

---

### Person B — run_inference() Service
**File:** `backend/app/services/inference.py`

**Step by step:**
1. Function: run_inference(image_bytes, age, sex, localization) → dict
2. Load model from model_loader (Person A's singleton). Get device.
3. Call preprocess_image(image_bytes) from Person C. Move tensor to device.
4. Tokenise metadata: same BertTokenizer call as training (padding=max_length, max_length=128, truncation=True). Move tokens to device.
5. Forward pass: model.eval(), torch.no_grad(), logits = model(image_tensor, input_ids, attention_mask)
6. Probabilities: torch.softmax(logits, dim=1)[0]
7. Predicted class: CLASS_NAMES[probabilities.argmax().item()]
8. Run GradCAM targeting model.cnn.features[-1] — THIS LAYER IS CRITICAL. Wrong layer = blank heatmap.
9. Encode heatmap as base64 PNG string
10. Return dict with: predicted_class, confidence, probabilities (dict of all 7), gradcam_image
11. Test by calling run_inference() directly in a Python script with a real image. Check all fields.

**Why this matters:** run_inference() is the heart of the entire application. Every prediction the user sees comes from this function. Test it thoroughly before handing to Person A.

---

### Person A — Wire Router to Real Inference
**File:** `backend/app/routers/predict.py`

**Step by step:**
1. Open predict.py. Find the mock response and delete it.
2. Import: from backend.app.services.inference import run_inference
3. In the predict endpoint, after validation: result = run_inference(contents, age, sex, localization)
4. Wrap in try-except: if inference throws any exception, raise HTTPException(status_code=500, detail=str(e))
5. Return result directly (it already matches PredictionResponse schema)
6. Start backend: uvicorn app.main:app --reload --port 8000
7. Open Swagger at http://localhost:8000/docs
8. Test with 5 different real HAM10000 images. Record predicted class and confidence for each.
9. Verify probabilities sum to approximately 1.0 for each response

**Why this matters:** The router is the last piece — it connects Person B's inference service to the HTTP interface. Once this works, the backend is complete.

---

## Daily Breakdown

| Day | Focus | Who |
|-----|-------|-----|
| Mon | C: write preprocess.py. Test with real image bytes. | C first — B needs this |
| Tue | B: write inference.py skeleton using Person C's preprocess_image(). | B |
| Wed | B: complete run_inference() with GradCAM. Test with 3 real images. | B |
| Thu | A: wire router to run_inference(). Remove mock. | A |
| Fri | A: test with 5 real HAM10000 images in Swagger. Record predictions. | A |
| Sat | All 3: review API responses together. Verify probabilities sum to ~1.0. | All 3 together |
| Sun | Weekly review. Does GradCAM show non-blank heatmaps? | All 3 together |

---

## Week 8 Checklist

### Person C
- [ ] Function: preprocess_image(image_bytes: bytes) → FloatTensor [1,3,256,256]
- [ ] Step 1: decode bytes → PIL Image: Image.open(io.BytesIO(image_bytes)).convert('R...
- [ ] Step 2: convert to numpy RGB array: np.array(pil_image)
- [ ] Step 3: apply CLAHE — same code as ml/src/preprocess/clahe.py (copy the function...
- [ ] Step 4: convert back to PIL Image: Image.fromarray(enhanced)

### Person B
- [ ] Function: run_inference(image_bytes, age, sex, localization) → dict
- [ ] Load model from model_loader (Person A's singleton). Get device.
- [ ] Call preprocess_image(image_bytes) from Person C. Move tensor to device.
- [ ] Tokenise metadata: same BertTokenizer call as training (padding=max_length, max_...
- [ ] Forward pass: model.eval(), torch.no_grad(), logits = model(image_tensor, input_...

### Person A
- [ ] Open predict.py. Find the mock response and delete it.
- [ ] Import: from backend.app.services.inference import run_inference
- [ ] In the predict endpoint, after validation: result = run_inference(contents, age,...
- [ ] Wrap in try-except: if inference throws any exception, raise HTTPException(statu...
- [ ] Return result directly (it already matches PredictionResponse schema)

### Team
- [ ] All files committed and pushed to GitHub
- [ ] team/week8_review.md written and committed
- [ ] Each person can explain their week's work to the other two

---

## Common Errors This Week

### GradCAM produces blank white image
**Fix:** The target layer is wrong. The GradCAM library silently returns a blank image when the layer has no gradients. Use model.cnn.features[-1] exactly. Print model layer names to verify.

### Device mismatch: expected cuda but got cpu
**Fix:** Every tensor must be moved to the same device as the model. After creating image_tensor and token tensors, call .to(device) on all of them.

### model has no attribute 'cnn'
**Fix:** The TorchScript model may wrap the original model differently. Print dir(model) to see available attributes. Try model.original_name or check what trace produced.

### base64 image broken in browser
**Fix:** Trailing whitespace in the base64 string breaks the img src. Strip it: base64.b64encode(buffer.getvalue()).decode('utf-8').strip()

---

## Deliverable

Real predictions from POST /predict. Probabilities sum to ~1.0. GradCAM heatmap in every response. Tested with 5 real HAM10000 images.

---

*SkinFuseNet · Week 8 · All 3 team members*