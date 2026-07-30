# SkinFuseNet — Person C Complete Work Plan
### Week 3 to Project End

> **Your layer ownership this phase:** Augmentation pipeline → Stratified split → BERT encoder branch → Focal loss + model assembly → Model export → Preprocessing service → Pydantic schemas → ProbabilityChart + GradCAMViewer → Full layout  
> **Your strength to build:** You assemble the final working model and own the frontend visual experience  
> **Golden rule:** The model assembly in week 6 depends on everyone else finishing their branches. Chase Person A and B early in the week — do not wait until day 5 to find out something is missing.

---

## Who Does What — Quick Reference

| Phase | Person A owns | Person B owns | Person C owns |
|-------|--------------|--------------|--------------|
| Week 3 | SAM full pipeline | CLAHE pipeline | Augmentation pipeline |
| Week 4 | Dataset finalisation | BERT tokenisation | Stratified split verification |
| Week 5 | EfficientNetV2 branch | Swin Transformer branch | BERT encoder branch |
| Week 6 | Training loop | Cross-attention fusion | Focal loss + model assembly |
| Week 7 | Ablation study | Evaluation metrics | Model export |
| Week 8 | Backend router | Inference service | Preprocessing service |
| Week 9 | Error handling + Docker | GradCAM backend | Pydantic schemas |
| Week 10 | ImageUpload + Disclaimer | ResultsPanel | ProbabilityChart + GradCAMViewer |
| Week 11 | Wire axios calls | Loading + error states | Full layout + polish |
| Week 12 | Integration testing | Bug fixing | Docker compose |
| Week 13 | README + demo | Deployment | Demo video |

---

## WEEK 3 — Augmentation Pipeline

**Your job this week:** Build the three augmentation methods from the paper — MixUp, CutMix, and RSPDA — as a unified augmentation pipeline that can be applied during training.

### What you are building
`ml/src/preprocess/augmentation.py` — a collection of augmentation functions that make the training data more diverse, improving the model's ability to generalise to new images it has never seen.

### How to think about it
Augmentation artificially increases the diversity of training data. MixUp blends two images together. CutMix cuts a patch from one image and pastes it onto another. RSPDA (Rotated and Shifted Patch Data Augmentation) applies rotation and translation at the feature level for dermoscopy-specific rotation invariance. These three together significantly reduce overfitting on the small minority classes.

### Day by day

**Day 1 — Understand each augmentation method**
Open a notebook. Implement MixUp first — it is the simplest. Take two images and their labels, blend them with a random lambda value sampled from a Beta distribution. Display the blended image. It should look like a ghost overlay of two different lesion images.

**Day 2 — Implement MixUp and CutMix**
MixUp: blend two images as a weighted average. CutMix: cut a rectangular region from image A and paste it onto image B. The label for CutMix is proportional to the area of each image visible. Both methods return a mixed image and a mixed label.

**Day 3 — Implement RSPDA**
RSPDA is the most complex. It works at the feature map level rather than the raw image level — meaning it applies rotation and translation to the intermediate feature maps inside the model during training, not to the raw pixels. For now implement a simpler version: apply random rotation (0, 90, 180, 270 degrees) and random translation to raw images. The feature-level version can be added later.

**Day 4 — Test all three visually**
For each augmentation method, display 6 example outputs on real HAM10000 images. Verify they look correct — MixUp should show blended images, CutMix should show patched images, RSPDA should show rotated and shifted images.

**Day 5 — Write the combined pipeline**
Write a function `apply_augmentation(image, label, aug_type)` that randomly applies one of the three methods with configurable probabilities. During training this is called on each batch with a probability — not every batch is augmented.

**Day 6 — Commit**
Commit `augmentation.py` with visual examples saved as PNG files in `ml/notebooks/`.

**Day 7 — Weekly review**

### Your deliverable to the team
`ml/src/preprocess/augmentation.py` with MixUp, CutMix, and RSPDA implemented and tested visually. Ready to be plugged into the training loop in week 6.

---

## WEEK 4 — Stratified Split Verification

**Your job this week:** Verify that the 70/20/10 stratified split in `dataset.py` correctly preserves class proportions in every split. This is critical — if the test set has no VASC images, you cannot evaluate VASC performance.

### What you are building
A verification notebook and a short verification script that confirms the class distribution in train, val, and test splits matches the original dataset distribution within acceptable tolerance.

### How to think about it
Stratified split means every split should have approximately the same percentage of each class as the full dataset. NV should be ~67% in train, ~67% in val, ~67% in test. DF should be ~1.1% in all three. If the splits are not stratified correctly, minority class evaluation is meaningless.

### Day by day

**Day 1 — Run the current split and check distribution**
Load `dataset.py` and run the split. For each of train, val, test, compute the class distribution. Print the percentage of each class in each split. Compare to the original dataset distribution.

**Day 2 — Check minority class counts**
Check how many DF and VASC samples are in the test set. With 115 DF images total and 10% test split, you should have approximately 11-12 DF images in the test set. If any class has fewer than 5 images in the test set, evaluation for that class is unreliable. Document this.

**Day 3 — Verify reproducibility**
Run the split 3 times with the same random_state=42 seed. Verify that you get exactly the same split every time — same images in train, same in val, same in test. This is important for reproducibility in the research paper.

**Day 4 — Write split_verification.py**
Write a standalone script that loads the split, computes class distributions for all three splits, prints a comparison table, and raises an alert if any class deviates more than 2 percentage points from the expected proportion.

**Day 5 — Document findings**
Write `team/split_verification_results.md` showing the class distribution for each split. Note any minority classes where the count is very low.

**Day 6 — Commit**
Commit `split_verification.py` and the results markdown.

**Day 7 — Weekly review**

### Your deliverable to the team
Verified stratified split with documented class distributions. `split_verification.py` that anyone can run to confirm the split is correct.

---

## WEEK 5 — BERT Encoder Branch

**Your job this week:** Build the BERT encoder branch that takes patient metadata tokens and produces a contextualised embedding capturing age, sex, and anatomical location information.

### What you are building
`ml/src/branches/bert.py` — a class that wraps `bert-base-uncased`, takes tokenised metadata as input, and produces an embedding of the agreed size that represents the patient context for that lesion.

### How to think about it
BERT produces a sequence of contextualised token embeddings. You only need one embedding per patient — the `[CLS]` token embedding at position 0 is conventionally used to represent the whole sequence. You take this [CLS] embedding and project it to the agreed embedding dimension with a linear layer. The clinical motivation is important: the same visual lesion means something very different for a 70-year-old woman on her lower extremity vs a 25-year-old man on his trunk.

### Day by day

**Day 1 — Load and explore BERT**
Load `bert-base-uncased` and run a sample metadata prompt through it. Print the output shape — it should be `[batch_size, sequence_length, 768]`. Understand that 768 is BERT's hidden size and you want position 0 (the CLS token) for the sentence representation.

**Day 2 — Understand the freezing strategy**
BERT has 110 million parameters. Fine-tuning all of them on 10,015 images causes overfitting. Strategy from the paper: freeze all BERT layers for the first 5 epochs, then gradually unfreeze layer by layer. For the branch class itself, start with all layers frozen. The training loop will handle unfreezing.

**Day 3 — Write bert.py**
Write the class. Load `bert-base-uncased`. Freeze all parameters initially. Add a linear projection from 768 (BERT hidden size) to the agreed embedding dimension. Forward method: takes input_ids and attention_mask, runs through BERT, takes CLS token output at position 0, projects to embedding size.

**Day 4 — Test in isolation**
Create fake token tensors of shape `[batch_size, 128]` and pass through the branch. Verify output shape is `[batch_size, embedding_dim]`. Print the parameter count — frozen parameters should not update during training.

**Day 5 — Verify with tokenised data**
Run the BERT tokenisation from Person B's dataset.py through your branch. Verify the full pipeline: raw metadata string → tokenised IDs → BERT embedding. Make sure everything connects correctly.

**Day 6 — Commit**
Commit `bert.py` with comments explaining the freezing strategy and why CLS token is used.

**Day 7 — Weekly review**

### Your deliverable to the team
`ml/src/branches/bert.py` — a class that takes `[B, 128]` token tensors and returns `[B, embedding_dim]` embeddings. Freezing strategy documented.

---

## WEEK 6 — Focal Loss + Model Assembly

**Your job this week:** Write the focal loss function and then assemble the complete SkinFuseNet model by combining all three branches, the fusion module, and the classification head into one end-to-end PyTorch model.

### What you are building
`ml/src/loss.py` — the focal loss function with label smoothing.  
`ml/src/model.py` — the complete SkinFuseNet model class that wraps all components.

### How to think about it
This is the week everything comes together. You take the CNN branch (Person A), Swin branch (Person B), BERT branch (you), fusion module (Person B), and combine them into one PyTorch `nn.Module`. The result is a model where you call `model(image, input_ids, attention_mask)` and get back 7 class logits.

### Day by day

**Day 1 — Write focal loss**
Implement focal loss with label smoothing in `loss.py`. The formula from the paper: `L = -Σ(1-pc)^γ log(pc)` with γ=2.0. Label smoothing replaces hard one-hot targets with soft targets using ε=0.1. Test that focal loss gives lower weight to easy examples compared to standard cross-entropy.

**Day 2 — Test focal loss vs cross-entropy**
In a notebook, create fake predictions and fake labels. Compute both focal loss and cross-entropy. Verify that for easy examples (high predicted probability for correct class), focal loss is significantly lower than cross-entropy. For hard examples, they should be similar.

**Day 3 — Assemble model.py**
Write `SkinFuseNet` class in `model.py`. It takes CNN branch, ViT branch, BERT branch, and fusion module as constructor arguments. The forward method: pass image through CNN and ViT branches simultaneously, pass tokens through BERT branch, pass all three embeddings through fusion, pass fused embedding through linear classification head, return 7 logits.

**Day 4 — Test full model forward pass**
Create a batch of fake images and fake tokens. Pass through the full model. Verify output shape is `[batch_size, 7]`. Print total parameter count. Verify gradients flow correctly by running a backward pass.

**Day 5 — Verify with Person A's training loop**
Share the assembled model with Person A and verify it fits into the training loop. The training loop calls `model(batch['image'], batch['input_ids'], batch['attention_mask'])` — make sure your model's forward method signature matches this.

**Day 6 — Commit**
Commit `loss.py` and `model.py` with comments explaining every design decision.

**Day 7 — Weekly review**

### Your deliverable to the team
`ml/src/loss.py` with focal loss and label smoothing. `ml/src/model.py` with complete assembled SkinFuseNet model. Full forward pass verified.

---

## WEEK 7 — Model Export

**Your job this week:** Take the best trained model checkpoint from Person A's ablation runs and export it to TorchScript format for serving in the backend.

### What you are building
`ml/src/export.py` — a script that loads the best checkpoint, converts to TorchScript, saves as `skinfusenet.pt`. The exported file is what gets copied into the backend.

### How to think about it
TorchScript is a way to save PyTorch models that does not require the original Python class definitions to load them. The backend loads `skinfusenet.pt` without needing to import any of the ML training code. This cleanly separates the ML codebase from the backend codebase.

### Day by day

**Day 1 — Wait for Person A's best checkpoint**
You cannot export until training is done. On day 1, check with Person A whether the best checkpoint from the full model run is saved. If it is not ready, use any checkpoint from an earlier ablation run to test the export process.

**Day 2 — Write export.py**
Write the script. Load the checkpoint. Recreate the model architecture. Load the state dict into the model. Set to eval mode. Run `torch.jit.trace()` with example inputs to produce the TorchScript version. Save with `torch.jit.save()`.

**Day 3 — Verify exported model**
Load the saved `skinfusenet.pt` with `torch.jit.load()`. Run a forward pass with a real image. Verify the output matches the original model's output. Verify the file can be loaded without importing any training code.

**Day 4 — Copy to backend**
Copy `skinfusenet.pt` to `backend/models/skinfusenet.pt`. Verify Person B's inference service can load it correctly.

**Day 5 — Document export process**
Write clear instructions in `team/model_export_guide.md` for how to re-export if training is re-run. Anyone on the team should be able to follow these steps.

**Day 6 — Commit**
Commit `export.py`. Do NOT commit the .pt file itself — it is hundreds of MB and is in .gitignore.

**Day 7 — Weekly review**

### Your deliverable to the team
`ml/src/export.py` that exports the model to TorchScript. `backend/models/skinfusenet.pt` placed in correct location. Verified that backend can load it.

---

## WEEK 8 — Preprocessing Service

**Your job this week:** Build the preprocessing service for the backend that applies the same image preprocessing at inference time as was applied during training.

### What you are building
`backend/app/services/preprocess.py` — a function that takes raw image bytes from an uploaded file and returns a preprocessed image tensor ready for the model.

### How to think about it
The model was trained on images that went through SAM segmentation, CLAHE enhancement, resizing to 256x256, and ImageNet normalisation. At inference time you must apply the same transformations in the same order. If you normalise with different values or skip CLAHE, the model sees inputs that look different from what it was trained on and performance drops significantly.

### Day by day

**Day 1 — List every training transform in order**
Open `dataset.py` and `clahe.py` and write down every preprocessing step in order. This is the exact sequence you must replicate at inference time. Resize → CLAHE → ToTensor → Normalize with ImageNet stats.

**Day 2 — Decide on SAM at inference time**
SAM takes 5-10 seconds per image. This makes every prediction request take 5-10 seconds just for preprocessing before inference even starts. Discuss with the team: run SAM at inference time (slow but consistent with training) or skip SAM and just apply CLAHE (fast but slightly different from training). Document the decision.

**Day 3 — Write preprocess.py**
Write `preprocess_image(image_bytes)` function. Takes raw bytes. Decodes to PIL Image. Applies the agreed transforms. Returns a tensor of shape `[1, 3, 256, 256]` (batch of 1, ready for model).

**Day 4 — Test with real uploaded images**
Simulate an upload by reading a HAM10000 image as bytes and passing to `preprocess_image()`. Verify the output tensor has the right shape, dtype (float32), and value range (approximately -3 to 3 after normalisation).

**Day 5 — Integration with inference.py**
Make sure Person B's `inference.py` can import and use your `preprocess_image()` function correctly. Test the full chain: raw image bytes → preprocess → model forward pass.

**Day 6 — Commit**
Commit `preprocess.py` with comments explaining each transform and why it matches training preprocessing.

**Day 7 — Weekly review**

### Your deliverable to the team
`backend/app/services/preprocess.py` with `preprocess_image()` function. Tested end to end with real image bytes.

---

## WEEK 9 — Pydantic Schemas

**Your job this week:** Finalise and harden all Pydantic schemas for the API — request validation and response models — and make sure they match the API contract exactly.

### What you are building
Final version of `backend/app/schemas/predict.py` with complete validation rules for every field in the request and complete type definitions for the response.

### How to think about it
Pydantic schemas are the contract between the frontend and backend made explicit in code. If the frontend sends age as a string instead of an integer, Pydantic catches it and returns a 422 with a clear message. If the backend tries to return a response with a missing field, Pydantic catches it at the server side. Good schemas prevent a whole class of bugs.

### Day by day

**Day 1 — Review the API contract**
Open `team/API_CONTRACT.md`. For every field in the request and every field in the response, think about validation rules. What is the minimum and maximum age? What are the exact allowed values for sex? What is the maximum allowed confidence value?

**Day 2 — Add validators to request schema**
Add field validators to `PredictionResponse` and create a proper request schema. For age: min=1, max=120. For sex: must be exactly "male" or "female". For localization: must be one of the 13 valid values. Use Pydantic v2 validators.

**Day 3 — Add validators to response schema**
Add validators to the response. Confidence must be between 0 and 1. Probabilities must be a dict with exactly 7 keys matching the 7 class codes. Sum of probabilities must be approximately 1.0 (within floating point tolerance). Gradcam_image must be a non-empty string.

**Day 4 — Test schema validation**
Write a small test that creates valid and invalid request objects and verifies that Pydantic raises the right errors for invalid ones.

**Day 5 — Update Swagger documentation**
Add descriptions and examples to every schema field so the Swagger UI at `/docs` shows clear documentation. Anyone who opens `/docs` should immediately understand what each field means and what values are valid.

**Day 6 — Commit**
Commit final `schemas/predict.py`.

**Day 7 — Weekly review**

### Your deliverable to the team
Final Pydantic schemas with complete validation. Clear Swagger documentation for every field.

---

## WEEK 10 — ProbabilityChart + GradCAMViewer

**Your job this week:** Build the two most visually important frontend components — the bar chart showing all 7 class probabilities and the GradCAM heatmap overlay viewer.

### What you are building
`frontend/src/components/ProbabilityChart.jsx` — a horizontal bar chart showing the probability the model assigned to each of the 7 classes.  
`frontend/src/components/GradCAMViewer.jsx` — displays the original uploaded image with the GradCAM heatmap overlaid on top.

### How to think about it
These two components are what make SkinFuseNet feel like a real clinical tool rather than just a text output. The probability chart helps users understand how confident the model is and what alternatives were considered. The GradCAM viewer shows exactly which part of the lesion drove the decision — this is what makes it explainable AI.

### Day by day

**Day 1 — Learn Recharts basics**
Open a notebook or a test React component. Import Recharts. Build a simple BarChart with hardcoded data. Understand how to set axis labels, bar colours, and tooltips. You will use `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `Cell` from Recharts.

**Day 2 — Build ProbabilityChart**
Build `ProbabilityChart.jsx`. It takes the probabilities dictionary from the API response as a prop. Displays all 7 classes as horizontal bars sorted by probability descending. The predicted class bar should be a different colour (blue or red depending on severity) from the others (grey). Show percentage labels on the bars.

**Day 3 — Test ProbabilityChart with mock data**
Hardcode the mock probabilities from the API contract and verify the chart looks correct. Check that bars are the right proportional length, labels are readable, and the highest bar is clearly highlighted.

**Day 4 — Build GradCAMViewer**
Build `GradCAMViewer.jsx`. It receives two props: the original uploaded image file and the gradcam_image base64 string from the API response. Display both images side by side — original on the left, heatmap overlay on the right. The heatmap is displayed as an img tag with `src={"data:image/png;base64," + props.gradcam_image}`.

**Day 5 — Add toggle between original and overlay**
Add a button that lets users toggle between seeing the original image and the GradCAM overlay. Some users want to compare them by switching. A toggle is more useful than side-by-side on mobile.

**Day 6 — Mobile responsiveness**
Both components must work on small screens. On mobile, show charts stacked vertically rather than side by side. Ensure text is readable.

**Day 7 — Weekly review and commit**

### Your deliverable to the team
`ProbabilityChart.jsx` — sorted bar chart of all 7 class probabilities with highlighted predicted class.  
`GradCAMViewer.jsx` — side-by-side or toggle view of original and heatmap overlay.

---

## WEEK 11 — Full Layout + Polish

**Your job this week:** Assemble all components into the final page layout, make it look professional, and ensure the complete user journey from landing to results feels smooth and intuitive.

### What you are building
Final `App.jsx` and `frontend/src/pages/Home.jsx` — the complete assembled page with all components in the right places, good spacing, consistent visual language, and a polished result experience.

### How to think about it
Polish is the difference between a project that works and a project that impresses. At this stage all components exist — your job is to arrange them thoughtfully, make spacing consistent, ensure visual hierarchy is clear (most important information is largest and most prominent), and add small details that make it feel finished.

### Day by day

**Day 1 — Define the page layout**
Draw the final page layout on paper. At the top: DisclaimerBanner. Below: header with app name and description. Then: the input section (upload + metadata form side by side on desktop, stacked on mobile). Submit button. Loading state. Results section (ResultsPanel + ProbabilityChart + GradCAMViewer). Think about what order makes sense.

**Day 2 — Assemble all components in App.jsx**
Import all 6 components. Place them in the layout you designed. Use Tailwind CSS grid or flexbox to arrange them. Make sure state flows correctly from top-level App.jsx down to each component via props.

**Day 3 — Visual consistency pass**
Go through every component and check: are font sizes consistent, are colours consistent, are border radius values consistent, is spacing (padding, margin) consistent. Make a list of inconsistencies and fix them.

**Day 4 — Responsive layout**
Test on mobile (Chrome DevTools → toggle device toolbar → iPhone SE). Fix every layout issue. On mobile: everything stacks vertically, buttons are large enough to tap, text is readable without zooming, the disclaimer banner does not take up too much vertical space.

**Day 5 — Final UX details**
Add these small details that make it feel finished: smooth CSS transitions when results appear (fade in), scroll to results section automatically when prediction arrives, clear visual separation between input section and results section, "Try another image" button resets everything cleanly.

**Day 6 — Cross-browser test**
Test in Chrome, Firefox, and Edge. Fix any rendering differences.

**Day 7 — Weekly review and commit**

### Your deliverable to the team
Complete polished frontend. Every component assembled and working. Mobile responsive. Consistent visual design throughout.

---

## WEEK 12 — Docker Compose

**Your job this week:** Write the `docker-compose.yml` that starts both the backend and frontend with a single command, and verify the complete system works inside Docker.

### What you are building
`docker-compose.yml` at the project root that orchestrates both services, with proper networking between them and GPU passthrough for the backend.

### How to think about it
Docker Compose makes the app reproducible on any machine. Without it, setting up the project requires following many manual steps. With it, anyone can run the full application with `docker-compose up` and it just works. The backend and frontend run in separate containers and communicate through Docker's internal networking.

### Day by day

**Day 1 — Understand Docker Compose concepts**
Read about Docker Compose networks. Two containers in the same compose file can communicate using their service names as hostnames. The frontend container can reach the backend at `http://backend:8000` instead of `http://localhost:8000`.

**Day 2 — Write docker-compose.yml**
Write the compose file with two services: backend (runs FastAPI) and frontend (serves React). Backend needs GPU passthrough. Frontend needs the `VITE_API_URL` environment variable set to `http://backend:8000` so it calls the backend by service name.

**Day 3 — Test docker-compose up**
Run `docker-compose up --build` from the project root. Both containers should start. Open `http://localhost:5173` in browser. Test a full prediction.

**Day 4 — Fix networking issues**
The most common issue: frontend cannot reach backend because it tries to call `localhost:8000` from inside a browser, not from inside Docker. The frontend JavaScript runs in the user's browser — so the API URL must be a URL the browser can reach, which is `http://localhost:8000` (mapped from the Docker container), not `http://backend:8000`.

**Day 5 — Add health check to compose**
Add a health check for the backend service so compose waits for the backend to be ready before starting the frontend. This prevents the frontend from trying to call an API that has not loaded the model yet.

**Day 6 — Commit final docker-compose.yml**

**Day 7 — Weekly review**

### Your deliverable to the team
Working `docker-compose.yml`. `docker-compose up --build` starts both services and the app works end to end.

---

## WEEK 13 — Demo Video

**Your job this week:** Record a professional demo video showing SkinFuseNet working end to end.

### What you are building
A 3-5 minute screen recording demonstrating the complete user journey, with voiceover explaining what is happening and why each component matters clinically.

### How to think about it
The demo video is what conference reviewers, classmates, and potential employers will watch. A good demo takes people through the clinical problem, shows the solution working, and highlights the key technical contributions: multimodal fusion, GradCAM explainability.

### Day by day

**Day 1 — Write the demo script**
Write what you will say for each part. Opening: the clinical problem (skin cancer, 100K+ cases, early detection saves lives). Show the app loading. Upload a melanoma image, fill in patient metadata, submit. While loading: explain what is happening inside (SAM, three branches, fusion). Show results: class prediction, confidence, probability chart, GradCAM heatmap. Highlight that the heatmap shows irregular borders — matching the ABCD diagnostic rule.

**Day 2 — Record a practice run**
Record a first attempt. Watch it back. Note anything that looks unclear or where you stumble. Adjust the script.

**Day 3 — Record the final demo**
Use OBS Studio (free) or Windows Game Bar (Win+G) to record. Record in 1080p. Make sure the app is running smoothly before starting. Use real HAM10000 test images — ideally one from each of the high-risk classes.

**Day 4 — Add simple editing**
Use Windows Video Editor (built into Windows 10/11) or DaVinci Resolve (free) to add: title card at the start with project name, captions for any technical terms, trim any long pauses.

**Day 5 — Upload and link**
Upload to YouTube (unlisted) or Google Drive. Add the link to the main README under a Demo section.

**Day 6 — Final review**
All three team members watch the demo together. Confirm it accurately represents the project.

**Day 7 — Done. Project complete.**

---

## Your Personal Weekly Sync Template

Every Sunday, answer these in `team/week{N}_review.md`:

**1. What did I finish this week?**
List every file you wrote or modified.

**2. What am I handing off to the team?**
What does Person A and B need from your work to continue their tasks next week?

**3. What do I need from Person A and Person B next week?**
Be specific — which file, which function, which output.

---

## Key Things to Remember Across All Weeks

**Model assembly in week 6 is the most coordination-heavy task.** You are combining components from all three people. Start chasing Person A and B for their branch files on Monday of week 6 — do not wait until they are done. If a branch is not ready, use a placeholder.

**Focal loss must be tested against plain cross-entropy.** Do not assume it is working correctly just because it runs without errors. Verify that focal loss gives lower weight to easy examples by comparing loss values on real training data.

**TorchScript export in week 7 can have issues.** Some PyTorch operations are not supported in TorchScript. If `torch.jit.trace()` fails, try `torch.jit.script()`. If that fails too, document it and serve the regular `.pt` checkpoint file instead — the backend can load both.

**ProbabilityChart must always show all 7 classes.** Even if some classes have near-zero probability. Users should always see the full picture.

**Your most important week is week 6.** The assembled model is what everything else depends on. If model.py does not work, training cannot run, the backend has nothing to serve, and the frontend has nothing to show. This is the central deliverable of the entire project.

**The Docker Compose networking gotcha.** The frontend JavaScript runs in the user's browser — not inside Docker. So the API URL in the frontend must be a URL that the browser can reach — `http://localhost:8000` — not the internal Docker hostname `http://backend:8000`. This confuses many beginners and wastes hours if you do not know about it upfront.

---

*SkinFuseNet · Person C Plan · Week 3 to Project End*
