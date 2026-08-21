# SkinFuseNet - Remaining Work

## Purpose

This document records the remaining work after comparing the project plans with the current files in the repository. It is a working checklist for Persons A, B, and C.

**Assessment date:** 2026-08-22

## Current Status

The project currently has a usable scaffold, not a complete end-to-end application.

### Confirmed complete or partially complete

- Repository structure exists for `backend`, `frontend`, `ml`, and `team`.
- FastAPI application starts from `backend/app/main.py`.
- `/health` endpoint exists.
- `/predict` endpoint accepts an image and metadata.
- Mock `/predict` validation exists for file type, file size, age, sex, and localization.
- Mock prediction response contains seven classes and a placeholder GradCAM image.
- Pydantic response models exist.
- React application shell exists.
- `ImageUpload.jsx` supports JPEG/PNG validation, size validation, preview, and drag/drop.
- `MetadataForm.jsx` collects age, sex, and localization.
- The frontend submit flow is currently a local alert/logging flow, not a real API call.

### Confirmed incomplete or empty

The following core files exist but are empty or not implemented:

- `ml/src/dataset.py`
- `ml/src/model.py`
- `ml/src/train.py`
- `ml/src/fusion.py`
- `ml/src/loss.py`
- `ml/src/evaluate.py`
- `ml/src/export.py`
- `ml/src/gradcam.py`
- `ml/src/branches/cnn.py`
- `ml/src/branches/vit.py`
- `ml/src/branches/bert.py`
- `ml/src/preprocess/sam_preprocess.py`
- `ml/src/preprocess/clahe.py`
- `ml/src/preprocess/augmentation.py`
- `backend/app/services/inference.py`
- `backend/app/services/preprocess.py`

The repository also does not yet show the planned result components, API client/hook, verification reports, Docker files, integration checklist, or deployment artifacts.

## Overall Completion Estimate

These are planning estimates based on file presence and implementation evidence, not measured test coverage or model quality.

| Area | Estimate | Explanation |
|---|---:|---|
| Repository and documentation setup | 70% | Structure and planning documents exist. Some planned team artifacts are missing. |
| Frontend input flow | 40% | Upload and metadata components exist; API submission and results UI are missing. |
| Backend mock API | 45% | FastAPI, validation, schemas, and mock response exist. Real inference is missing. |
| ML preprocessing | 5% | Dataset and preprocessing scripts are present as files but not implemented. |
| ML model and training | 0-5% | Model branches, fusion, loss, model assembly, and training files are empty. |
| Evaluation and export | 0% | Evaluation, GradCAM, and export files are empty. |
| Deployment and integration | 0% | Docker, compose, end-to-end tests, and deployment are not present in the current scaffold. |
| **Whole project** | **approximately 20-30%** | The foundation and mock workflow exist; the real product path remains. |

## Critical Dependency Order

Work should proceed in this order because later steps depend on earlier outputs:

1. Agree and write the API/model contract.
2. Build preprocessing and dataset loading.
3. Build all three model branches.
4. Build fusion, focal loss, and complete model assembly.
5. Build and validate the training loop.
6. Run ablations and select a best checkpoint.
7. Export the model and place it in the backend model directory.
8. Build inference, preprocessing, and GradCAM services.
9. Replace the mock backend response with real inference.
10. Build the results frontend and connect the frontend to the API.
11. Run integration tests, Docker, deployment, and final documentation.

Do not spend time polishing the final results screen before a real model response exists, but the frontend can continue using the existing mock response while the ML work is underway.

---

# Person A Remaining Work

Person A owns the data path, CNN branch, training orchestration, backend router integration, upload polish, and integration testing.

## Priority 1 - Data and preprocessing

- [ ] Implement `ml/src/preprocess/sam_preprocess.py`.
  - Load the SAM checkpoint.
  - Process a small sample first, then the complete HAM10000 dataset.
  - Save outputs using filenames that `dataset.py` can locate.
  - Add fallback behavior when segmentation fails.
  - Record failures in a log.
  - Visually inspect representative outputs.
- [ ] Coordinate the SAM output format with Person B's CLAHE script.
- [ ] Produce and verify the processed-image directory.
- [ ] Implement and harden `ml/src/dataset.py`.
  - Load image and metadata together.
  - Handle missing age, unknown sex/localization, missing files, and corrupt images.
  - Use reproducible train/validation/test splits.
  - Return documented tensor shapes and dtypes.
- [ ] Add `verify_dataset.py` to check batches from train, validation, and test splits.

## Priority 2 - CNN and training

- [ ] Implement `ml/src/branches/cnn.py` with EfficientNetV2.
  - Use the agreed shared embedding dimension.
  - Verify output shape `[batch_size, embedding_dim]`.
  - Document the fine-tuning/freezing strategy.
- [ ] Implement `ml/src/train.py`.
  - Train and validate the complete model.
  - Log loss, accuracy, macro F1, and learning rate.
  - Add checkpoint saving and early stopping.
  - Test first with fake data, then a small real subset, then the full dataset.
- [ ] Run all seven ablation configurations.
- [ ] Save measured accuracy and macro F1 values in `team/ablation_results.md`.
- [ ] Identify and share the best checkpoint.

## Priority 3 - Backend and frontend ownership

- [ ] Update `backend/app/routers/predict.py` to call real `run_inference()`.
- [ ] Preserve the existing validation and response contract.
- [ ] Test at least five real HAM10000 images.
- [ ] Add inference exception handling with useful HTTP errors.
- [ ] Finish `ImageUpload.jsx` and `DisclaimerBanner.jsx` accessibility and mobile polish.
- [ ] Add the frontend API submission flow once the real backend is available.
- [ ] Lead the complete integration checklist and resolve cross-module failures.

## Person A completion criteria

Person A's work is complete when:

- The dataset can produce verified train/validation/test batches.
- The CNN branch returns the agreed embedding shape.
- Training runs end to end and saves a measured best checkpoint.
- The router returns real predictions instead of hardcoded mock data.
- Upload validation and error states work on desktop and mobile.
- The full application passes the integration checklist.

---

# Person B Remaining Work

Person B owns CLAHE, metadata tokenization, Swin, fusion, evaluation, inference, GradCAM, results display, and deployment.

## Priority 1 - Preprocessing and model components

- [ ] Implement `ml/src/preprocess/clahe.py`.
  - Read SAM outputs.
  - Apply LAB/L-channel CLAHE.
  - Test parameters on a small sample.
  - Process the full dataset and verify file counts.
- [ ] Implement BERT tokenization in `ml/src/branches/bert.py` or the agreed data module.
  - Use the shared prompt format.
  - Use padding, truncation, and `max_length=128`.
  - Verify batch shapes `[batch_size, 128]`.
- [ ] Implement `ml/src/branches/vit.py` with Swin Transformer V2.
  - Match the shared embedding dimension.
  - Test against the CNN output shape.
- [ ] Implement `ml/src/fusion.py`.
  - Combine CNN, ViT, and metadata embeddings.
  - Use the agreed cross-attention design.
  - Verify output shape and learnable parameter count.

## Priority 2 - Evaluation and inference

- [ ] Implement `ml/src/evaluate.py`.
  - Load the best checkpoint.
  - Calculate accuracy, precision, recall, macro F1, per-class metrics, and confusion matrix.
  - Save required plots under `ml/logs/`.
  - Record results in `team/final_results.md`.
- [ ] Implement `backend/app/services/inference.py`.
  - Load the exported model once, rather than on every request.
  - Preprocess image and metadata consistently with training.
  - Run evaluation-mode inference on a consistent device.
  - Return all response fields with probabilities summing to approximately 1.
- [ ] Implement `ml/src/gradcam.py` or the agreed backend GradCAM module.
  - Target the correct final CNN convolutional layer.
  - Test all seven classes.
  - Return a valid fallback image if GradCAM fails.
- [ ] Document inference time and model-loading behavior.

## Priority 3 - Frontend and deployment

- [ ] Build `frontend/src/components/ResultsPanel.jsx`.
  - Show class name, confidence, severity, clinical description, and disclaimer.
- [ ] Build loading and error states.
- [ ] Fix inference, GradCAM, and ResultsPanel bugs found in integration testing.
- [ ] Prepare deployment configuration and test the deployed application.

## Person B completion criteria

Person B's work is complete when:

- CLAHE output is generated and loadable by the dataset.
- Tokenization and Swin/fusion outputs have verified shapes.
- Evaluation produces reproducible metrics and plots.
- `run_inference()` works on real images and returns the API contract.
- GradCAM produces a nonblank displayable image or a safe fallback.
- The result panel and loading/error UI display real backend responses.
- Deployment has been tested with a real prediction.

---

# Person C Remaining Work

Person C owns augmentation, split verification, BERT encoding, focal loss, model assembly, export, API schemas, charts, layout, and Docker Compose.

## Priority 1 - Dataset and model assembly

- [ ] Implement `ml/src/preprocess/augmentation.py`.
  - Add MixUp.
  - Add CutMix.
  - Add the agreed RSPDA approximation or implementation.
  - Save visual examples and verify labels/weights.
- [ ] Implement `split_verification.py`.
  - Verify class proportions in train, validation, and test.
  - Verify reproducibility with a fixed seed.
  - Document minority-class counts in `team/split_verification_results.md`.
- [ ] Implement `ml/src/branches/bert.py`.
  - Load BERT.
  - Use the CLS embedding.
  - Apply the agreed freezing/unfreezing strategy.
  - Project to the shared embedding dimension.
- [ ] Implement `ml/src/loss.py` with focal loss and label smoothing.
- [ ] Implement `ml/src/model.py`.
  - Combine CNN, ViT, BERT, and fusion.
  - Return seven class logits.
  - Verify forward and backward passes.

## Priority 2 - Export and API contract

- [ ] Implement `ml/src/export.py`.
  - Load the best checkpoint.
  - Export to TorchScript or document an alternative serving format if TorchScript is unsupported.
  - Verify exported output matches the original model.
  - Copy the serving artifact to `backend/models/` without committing large model files.
- [ ] Implement `backend/app/services/preprocess.py`.
  - Decode uploaded bytes.
  - Match the training transform order.
  - Return `[1, 3, 256, 256]` float32 tensors.
- [ ] Harden `backend/app/schemas/predict.py`.
  - Validate age, sex, localization, confidence, class keys, probability ranges, and probability sum.
  - Add clear Swagger examples and descriptions.
  - Add schema tests.

## Priority 3 - Frontend and Docker

- [ ] Build `ProbabilityChart.jsx`.
  - Show all seven classes.
  - Sort by probability.
  - Highlight the predicted class.
- [ ] Build `GradCAMViewer.jsx`.
  - Display the original image and GradCAM overlay.
  - Add a mobile-friendly toggle or stacked layout.
- [ ] Assemble and polish the final layout in `App.jsx`.
  - Add results, loading, error, reset, and responsive states.
  - Verify the full user journey.
- [ ] Create `docker-compose.yml`.
  - Start backend and frontend.
  - Configure browser-reachable API URL.
  - Add backend health checks.
- [ ] Record the final demo video and add its link to the root README.

## Person C completion criteria

Person C's work is complete when:

- Augmentation output is visually and numerically verified.
- Splits are reproducible and class distributions are documented.
- BERT and model assembly pass forward/backward tests.
- The model exports and reloads for serving.
- API schemas reject invalid requests and responses clearly.
- Probability and GradCAM views work with real API data.
- Compose starts the complete application successfully.
- The demo accurately represents the final system.

---

# Shared Work and Handoffs

## Required shared decisions

- [ ] Agree the embedding dimension used by CNN, Swin, and BERT.
- [ ] Create `team/API_CONTRACT.md` with request fields, response fields, class names, tensor shapes, and preprocessing rules.
- [ ] Decide whether SAM runs during inference or whether the serving path uses a documented faster alternative.
- [ ] Decide where processed images live and which script owns each transformation.
- [ ] Decide how large model checkpoints are shared without committing them to Git.

## Required shared artifacts

- [ ] `team/API_CONTRACT.md`
- [ ] `team/week3_review.md` through `team/week13_review.md`
- [ ] `team/ablation_results.md`
- [ ] `team/split_verification_results.md`
- [ ] `team/final_results.md`
- [ ] `team/model_export_guide.md`
- [ ] `team/integration_checklist.md`
- [ ] `team/integration_results.md`
- [ ] Root README updated with setup, architecture, measured results, demo, and limitations.

## Recommended immediate sprint

### First

1. Person A: implement the dataset contract and run a tiny batch verification.
2. Person B: implement CLAHE and tokenization against that contract.
3. Person C: write the API/model contract and implement the initial model assembly interfaces.

### Next

4. Person A: implement CNN and training skeleton.
5. Person B: implement Swin and fusion.
6. Person C: implement BERT, focal loss, and model assembly.
7. All three: run a fake-data forward/backward integration test before using the full HAM10000 dataset.

### Then

8. Run real preprocessing and a small real-data training test.
9. Run the full training and ablation study.
10. Integrate inference, GradCAM, frontend results, and Docker.
11. Run the 20-test integration checklist.
12. Update documentation and record the demo.

## Definition of Done

The project should not be considered complete until all of the following are true:

- A fresh environment can start the backend and frontend using documented commands.
- A real image and metadata can travel from the browser to the backend.
- The backend loads a verified model and returns a real seven-class prediction.
- Probabilities are valid and sum to approximately 1.0.
- GradCAM returns a displayable image or a documented fallback.
- The frontend displays prediction, confidence, all probabilities, and explanation output.
- Dataset, model, inference, and API tests pass.
- Docker Compose starts the system successfully.
- Results, limitations, medical disclaimer, and demo instructions are documented.

## Important limitation

This application is a research prototype and must not be presented as a medical diagnosis tool. Final documentation and the interface should clearly state that predictions require qualified clinical review.
