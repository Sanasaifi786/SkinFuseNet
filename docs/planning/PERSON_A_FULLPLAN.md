# SkinFuseNet — Person A Complete Work Plan
### Week 3 to Project End

> **Your layer ownership this phase:** ML preprocessing → Training loop → Backend router → Frontend upload components  
> **Your strength to build:** You understand the full data pipeline from raw image to trained model  
> **Golden rule:** Finish your deliverable for the week before helping others. Then help.

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

## WEEK 3 — SAM Full Preprocessing Pipeline

**Your job this week:** Take the SAM notebook you built in week 2 and turn it into a production script that runs on all 10,015 HAM10000 images automatically and saves the results to disk.

### What you are building
A script called `sam_preprocess.py` that loops through every image in the dataset, runs SAM segmentation to isolate the lesion, applies the lesion mask to black out everything outside, saves the result as a new image in `ml/data/processed/`. This runs once and saves to disk so training never has to do it again.

### How to think about it
The notebook you wrote in week 2 worked on one image. This week you scale it to all 10,015 images. The main challenges are speed (SAM on CPU is slow — use GPU), failed segmentations (some images SAM cannot segment well — have a fallback), and file organisation (processed images must be named the same as originals so the Dataset class can find them).

### Day by day

**Day 1 — Plan and design the script**
Before writing anything, open a notebook and think through the logic. What happens if SAM finds no segments? What happens if the image is already clean with no artifacts? What does the output filename look like? Write pseudocode in comments first, then fill in the actual code. The script should print progress every 100 images and save a log of any images it failed on.

**Day 2 — Write and test on 50 images**
Write the full `sam_preprocess.py` script. Test it on just 50 images first — not all 10,015. Check that the output images look correct by opening a few in an image viewer. The lesion should be visible, everything outside should be black or white.

**Day 3 — Run on full dataset**
Once the 50-image test works, run on all 10,015. On a GPU this takes about 2-3 hours. Start it before going to sleep. Check the log file in the morning for any failures.

**Day 4 — Review outputs and fix failures**
Open 20 random processed images and visually check them. Some will look wrong — SAM picked the wrong segment, or the mask is too small. For images where SAM failed, use the fallback strategy: just use the full image resized to 256x256 without masking. These are edge cases and there will be few of them.

**Day 5 — Help Person B with CLAHE**
Your preprocessing runs first, then Person B's CLAHE runs on your output. On day 5, sit with Person B and make sure your output format matches what their CLAHE script expects as input. The key thing to agree on: are processed images saved as RGB JPEGs at original resolution, or already resized to 256x256? Agree and document this.

**Day 6 — Commit and document**
Write a comment block at the top of `sam_preprocess.py` explaining exactly what it does, what inputs it expects, what outputs it produces, and what the fallback strategy is. Commit to GitHub.

**Day 7 — Weekly review**
Write `team/week3_review.md` answering: what did you finish, what failed, what does the team need to know before week 4.

### Your deliverable to the team
A folder `ml/data/processed/` containing 10,015 preprocessed images, all SAM-masked. A log file showing which images used the fallback. A committed `sam_preprocess.py` that anyone can re-run.

---

## WEEK 4 — Dataset Finalisation

**Your job this week:** Make `dataset.py` production-ready. The week 2 version was a first draft. This week you harden it — handle all edge cases, make sure the stratified split is reproducible with a seed, and verify that every batch coming out has the exact right shapes and values.

### What you are building
The final version of `dataset.py` that the training loop will use. It must handle missing ages gracefully, handle the processed image folder structure correctly, produce consistent splits every time using the same random seed, and pass a verification script that checks shapes.

### How to think about it
Think of this as making the dataset class bulletproof. If training crashes at 3am because a batch had a None value, that is a dataset bug. Your job is to make sure that cannot happen.

### Day by day

**Day 1 — Audit the week 2 version**
Go through `dataset.py` line by line and list every place something could go wrong. Missing age. Unknown sex value. Image file not found. Corrupted image file. Write these down before fixing any of them.

**Day 2 — Fix all edge cases**
For each problem you listed, add a safe fallback. Missing age becomes the median (45). Unknown localization becomes the unknown class. Image not found logs an error and skips the sample. Corrupted image returns a black tensor instead of crashing.

**Day 3 — Point dataset to processed images**
Update the image paths to load from `ml/data/processed/` instead of `ml/data/raw/`. Verify that all 10,015 processed images can be found. Print a count of how many were found vs missing.

**Day 4 — Write verification script**
Write a separate small script called `verify_dataset.py` that loads one batch from each of train, val, and test, and checks every shape, every dtype, and every value range. Image values should be between -3 and 3 after normalisation. Labels should be 0-6. Ages should be 0-1. This script should print PASS or FAIL for each check.

**Day 5 — Run verification and fix failures**
Run `verify_dataset.py` and fix anything that fails. Share results with the team.

**Day 6 — Commit final version**
Commit both `dataset.py` and `verify_dataset.py` to GitHub. Write a comment at the top of dataset.py showing example output shapes.

**Day 7 — Weekly review**
Write `team/week4_review.md`.

### Your deliverable to the team
Final `dataset.py` that loads from processed images, handles all edge cases, produces correct shapes. A `verify_dataset.py` that anyone can run to confirm the dataset is working.

---

## WEEK 5 — EfficientNetV2 CNN Branch

**Your job this week:** Build the CNN branch of SkinFuseNet — the EfficientNetV2 model that extracts local texture, border, and colour features from the lesion image.

### What you are building
A Python class in `ml/src/branches/cnn.py` that takes a batch of images as input and produces a feature embedding as output. This is one of three parallel branches that will be fused together in week 6.

### How to think about it
EfficientNetV2 is a pretrained CNN from Google. You load it with ImageNet weights, remove its final classification head, and add a new projection layer that outputs a fixed-size embedding vector. The size of this embedding must match what the fusion layer in week 6 expects — agree this with Person C before you start.

### Day by day

**Day 1 — Understand EfficientNetV2 architecture**
Load EfficientNetV2 from timm and print its layers. Understand which layer is the feature extractor and which is the classification head. Figure out the size of the feature vector before the head. This number is important — it is the embedding dimension for your branch.

**Day 2 — Agree embedding dimension with team**
All three branches must output embeddings of the same size so cross-attention fusion works. Sit with Person B (Swin) and Person C (BERT + fusion) and agree on a number. Common choice is 512 or 768. Write this in `team/API_CONTRACT.md`.

**Day 3 — Write cnn.py**
Write the class. It should load EfficientNetV2 with pretrained weights, replace the classification head with a linear projection to the agreed embedding size, and have a forward method that takes images and returns embeddings. Verify output shape matches what was agreed.

**Day 4 — Test the branch in isolation**
Write a small test at the bottom of `cnn.py` (under `if __name__ == "__main__"`) that creates a random batch, passes it through, and prints the output shape. It should match `[batch_size, embedding_dim]`.

**Day 5 — Fine-tuning strategy**
Decide which layers to freeze. A common strategy for beginners: freeze all layers except the last two blocks and the projection head. This makes training faster and prevents overfitting. Document this decision in a comment.

**Day 6 — Commit**
Commit `cnn.py` with comments explaining every design decision.

**Day 7 — Weekly review**

### Your deliverable to the team
`ml/src/branches/cnn.py` — a class that takes `[B, 3, 256, 256]` tensors and returns `[B, embedding_dim]` embeddings. Test output verified.

---

## WEEK 6 — Training Loop

**Your job this week:** Write the main training loop in `train.py` that orchestrates the entire training process — loads batches, runs forward pass through all three branches and fusion, computes loss, updates weights, saves checkpoints.

### What you are building
`ml/src/train.py` — the script that you run to actually train SkinFuseNet. It uses the dataset from week 4, the three branches from week 5, the fusion layer and loss function from Person B and C, and produces model checkpoints saved to `ml/checkpoints/`.

### How to think about it
The training loop is the conductor. It does not do the hard work itself — it calls the components that others built and coordinates them. You need all three branches and the fusion layer working before you can write this. Coordinate with Person B and C on which days their components will be ready.

### Day by day

**Day 1 — Design the training loop on paper**
Before coding, write the pseudocode. Every epoch: shuffle training data, for each batch: forward pass → loss → backward → optimizer step → log metrics. After each epoch: run validation, save checkpoint if validation F1 improved.

**Day 2 — Set up Weights and Biases (W&B)**
Create a free account at wandb.ai. Initialise W&B in the training script. Every epoch should log: train loss, val loss, val accuracy, val macro F1, learning rate. This gives you a live dashboard while training.

**Day 3 — Write the training loop skeleton**
Write `train.py` with all the structure but with placeholder calls where the model, loss, and data go. Verify the loop logic works with a tiny fake model and 10 fake samples before plugging in real components.

**Day 4 — Plug in real components**
Replace fake placeholders with real dataset, real model (once Person B and C have their components ready), real focal loss. Run one epoch on a small subset (100 images) and verify loss decreases.

**Day 5 — Add checkpointing and early stopping**
After each epoch, if validation macro F1 is better than the previous best, save the checkpoint to `ml/checkpoints/best_model.pt`. Add early stopping: if F1 does not improve for 15 consecutive epochs, stop training. Log which epoch stopped and why.

**Day 6 — Test full training run for 5 epochs**
Run for 5 epochs on the full dataset. Verify loss is decreasing, W&B dashboard is updating, checkpoints are being saved. Fix any issues.

**Day 7 — Weekly review**

### Your deliverable to the team
`ml/src/train.py` that runs end to end, logs to W&B, saves checkpoints, and has early stopping.

---

## WEEK 7 — Ablation Study

**Your job this week:** Run the 7 training configurations from the paper — starting with CNN only and adding one component at a time. Record results for each. This is the ablation study table in your paper.

### What you are building
7 separate training runs, each producing a checkpoint and a results entry. A summary table showing accuracy and F1 for each configuration. This directly becomes Table III in your research paper.

### How to think about it
You run the same training loop 7 times with slightly different configurations. The configurations are exactly as in the paper: CNN only, then add Swin, then add BERT, then add SAM preprocessing, then add focal loss, then add augmentation, then the full model. Each run takes several hours on GPU so plan these over multiple days running overnight.

### Day by day

**Day 1 — Set up config system**
Create a `config.yaml` file that controls which components are enabled. Boolean flags for: use_vit, use_bert, use_sam_preprocessing, use_focal_loss, use_augmentation. The training script reads this file. This way you can change configs without touching code.

**Day 2 — Run Config 1: CNN only**
Set all flags to false except the CNN. Start training. Let it run overnight. Note the final accuracy and macro F1.

**Day 3 — Run Config 2: CNN + Swin**
Enable use_vit. Run overnight. Record results.

**Day 4 — Run Config 3: CNN + Swin + BERT**
Enable use_bert. Run overnight. Record results.

**Day 5 — Run Configs 4 and 5**
Config 4: add SAM preprocessing. Config 5: add focal loss. These can be run back to back if your GPU is available all day.

**Day 6 — Run Configs 6 and 7**
Config 6: add augmentation. Config 7: full model. Full model training is the most important run — let it go for the full 100 epochs with early stopping.

**Day 7 — Compile results table**
Write all 7 results into `team/ablation_results.md`. Share with team. This becomes Table III in the paper.

### Your deliverable to the team
7 trained checkpoints. `team/ablation_results.md` with all accuracy and F1 numbers. Best model checkpoint at `ml/checkpoints/best_model.pt`.

---

## WEEK 8 — Backend Router

**Your job this week:** Replace the mock `/predict` endpoint you built in week 5 with the real one that loads the trained model and runs actual inference.

### What you are building
`backend/app/routers/predict.py` — updated to call the real inference service. The mock response is replaced with actual model output.

### How to think about it
The structure of the endpoint stays exactly the same as the mock — same validation, same response schema. The only thing that changes is: instead of returning hardcoded fake JSON, it calls `inference.py` (built by Person B) which runs the real model. Your job is to wire the router to the inference service cleanly.

### Day by day

**Day 1 — Copy best model checkpoint to backend**
Copy `ml/checkpoints/best_model.pt` to `backend/models/skinfusenet.pt`. Verify the file is there and not corrupted by checking file size — should be several hundred MB.

**Day 2 — Update router to call inference service**
Remove the mock response from `predict.py`. Replace it with a call to `run_inference()` from Person B's `inference.py`. Pass the image bytes and metadata values. Return what inference returns.

**Day 3 — Test with real image**
Upload a real HAM10000 test image through Swagger. Watch the terminal — you should see the model loading, inference running, and a real prediction coming back. Check that predicted class is one of the 7 valid classes.

**Day 4 — Verify response matches schema**
Check that the real response has all 4 fields: predicted_class, confidence, probabilities (all 7 classes), gradcam_image. Check that probabilities sum to approximately 1.0.

**Day 5 — Handle inference errors**
What happens if the model crashes during inference? Add a try-except around the inference call that returns a 500 error with a clear message instead of crashing the server.

**Day 6 — Commit**
Commit the updated router with clear comments showing what changed from the mock version.

**Day 7 — Weekly review**

### Your deliverable to the team
Updated `backend/app/routers/predict.py` that returns real model predictions. Tested with at least 5 real HAM10000 test images.

---

## WEEK 9 — Error Handling + Docker

**Your job this week:** Make the backend production-quality with complete error handling and package it in a Docker container.

### What you are building
Complete error handling for every edge case in the API. A `Dockerfile` for the backend that anyone can use to run it without installing Python manually.

### How to think about it
Error handling means: every possible way a request can be wrong should return a clear, helpful error message — not a server crash or a confusing 500 error. Docker means: anyone on the team can run the backend with one command regardless of what Python version they have.

### Day by day

**Day 1 — List all possible error cases**
Go through the predict endpoint and list every way it can fail. Wrong file type. File too large. Missing field. Model not loaded. Inference crashes. Image cannot be decoded. Write them all down.

**Day 2 — Add error handling for each case**
For each error case, add a specific HTTP exception with a clear message that tells the user exactly what went wrong and how to fix it.

**Day 3 — Test every error case**
Go through Swagger and deliberately trigger every error case. Verify each one returns the right status code and a helpful message.

**Day 4 — Write the Dockerfile**
Write `backend/Dockerfile`. It should: start from a Python 3.12 base image, install all requirements, copy the app code, copy the model file, expose port 8000, run uvicorn on startup.

**Day 5 — Test Docker build**
Build the Docker image and run it. Test that the API works the same way inside Docker as it does outside. Fix any issues with paths or missing files.

**Day 6 — Commit**
Commit Dockerfile and updated error handling.

**Day 7 — Weekly review**

### Your deliverable to the team
Complete error handling for all edge cases. Working `backend/Dockerfile` that builds and runs successfully.

---

## WEEK 10 — ImageUpload + DisclaimerBanner Components

**Your job this week:** Polish and finalise the two React components you built in week 2. They should now be production-quality with good UX, proper accessibility, and mobile responsiveness.

### What you are building
Final versions of `ImageUpload.jsx` and `DisclaimerBanner.jsx` — the first things users see and interact with.

### How to think about it
The week 2 versions were functional but rough. This week you make them feel professional. Good drag and drop UX. Clear error messages. Mobile-friendly layout. Accessible labels for screen readers.

### Day by day

**Day 1 — Review week 2 versions**
Open both components and list what feels rough. No drag and drop visual feedback. No progress indicator. Error messages could be clearer. Make a list.

**Day 2 — Improve ImageUpload UX**
Add a visual highlight when the user drags a file over the drop zone. Add a clear button to remove the selected image and start over. Show file size alongside filename. Make the drop zone larger on mobile.

**Day 3 — Improve error messages**
Make error messages specific and actionable. Instead of "Invalid file type" say "Please upload a JPEG or PNG image. The file you selected is a PDF." Test with various wrong file types.

**Day 4 — Improve DisclaimerBanner**
Make it visually distinct — yellow background, warning icon, strong but not alarming wording. Test that it stays visible when the user scrolls down. It must always be in view.

**Day 5 — Mobile responsiveness**
Open the app on your phone or use Chrome DevTools mobile simulation. Fix anything that looks broken on small screens. Buttons should be large enough to tap. Text should be readable without zooming.

**Day 6 — Commit final versions**
Commit both components with comments explaining every prop and state variable.

**Day 7 — Weekly review**

### Your deliverable to the team
Final `ImageUpload.jsx` and `DisclaimerBanner.jsx` — polished, mobile-friendly, fully tested.

---

## WEEK 11 — Wire Axios Calls

**Your job this week:** Replace all hardcoded mock data in the frontend with real API calls. Connect the submit button to the real backend.

### What you are building
Updated `usePrediction.js` hook and `predict.js` API file that call the real backend endpoint and handle all response states correctly.

### How to think about it
The week 2 hook called the mock endpoint. Now the real backend is live. The axios call is the same — same URL, same FormData structure. But now you handle real responses, real errors, real loading times (inference takes 5-10 seconds), and real GradCAM images.

### Day by day

**Day 1 — Verify backend is running with real model**
Before touching frontend, confirm the backend returns real predictions by testing in Swagger. Note the actual response time — this tells you how long the loading spinner will show.

**Day 2 — Update usePrediction hook**
Make sure error handling covers all backend error codes: 400 (bad image), 413 (too large), 422 (missing field), 500 (server error). Each should show a different, helpful message on screen.

**Day 3 — Test end to end with real HAM10000 images**
Upload 5 real test images with correct metadata. Verify you get back real class predictions and real GradCAM images. Check that probabilities sum to 1.0.

**Day 4 — Handle slow responses**
Inference takes several seconds. The loading spinner must show during this time. Add a message like "Analysing lesion — this takes a few seconds" so users do not think it is frozen.

**Day 5 — Test error flows**
Deliberately send bad requests from the frontend. Wrong file type. No sex selected. Very large file. Verify each shows the right error message from the backend, not a generic crash.

**Day 6 — Commit**
Commit updated hook and API file.

**Day 7 — Weekly review**

### Your deliverable to the team
Fully connected frontend that calls real backend, shows real predictions, handles all errors gracefully.

---

## WEEK 12 — Integration Testing

**Your job this week:** Run the complete system end to end and verify every integration checkpoint passes.

### What you are building
A checklist of 20 integration tests, all passing. Document any bugs found and fixed.

### How to think about it
Integration testing means testing the whole system together, not individual components. Things that work fine in isolation can break when connected. Your job is to find and fix these breaks.

### Day by day

**Day 1 — Set up integration test checklist**
Write `team/integration_checklist.md` with 20 specific tests. Examples: probabilities sum to 1.0, GradCAM image displays on screen, 400 error shows correct message, loading spinner appears, result panel shows all 7 class probabilities.

**Day 2 — Run docker-compose up**
Start both backend and frontend with docker-compose. Test that everything works the same inside Docker as it did outside.

**Day 3 — Run all 20 integration tests**
Go through every test on the checklist. Mark pass or fail. For every fail, write down exactly what went wrong.

**Day 4 — Fix all failures**
Fix every failing test. Coordinate with Person B and C if the fix touches their components.

**Day 5 — Re-run all tests**
Run the full checklist again. All 20 should pass.

**Day 6 — Document results**
Write `team/integration_results.md` showing all tests passed. Include screenshots.

**Day 7 — Weekly review**

### Your deliverable to the team
All 20 integration tests passing. Clean docker-compose run.

---

## WEEK 13 — README + Demo

**Your job this week:** Write the final project README and coordinate the demo.

### What you are building
The final `README.md` at the root of the project — the first thing anyone sees when they visit your GitHub repo. Complete, accurate, professional.

### Day by day

**Day 1 — Update main README with final results**
Replace placeholder numbers with real ablation results. Update progress tracker to show all items complete. Add actual accuracy and F1 scores.

**Day 2 — Write setup instructions for a fresh machine**
Test the setup instructions on a fresh machine or ask someone who has not seen the project to follow them. Fix any steps that are unclear or missing.

**Day 3 — Write the model architecture section**
Describe the four-stage pipeline clearly. Include the pipeline diagram. Make it understandable to someone who has not read the paper.

**Day 4 — Record demo video**
Record a 3-5 minute demo showing: starting the app, uploading a HAM10000 image, filling in metadata, seeing the prediction and GradCAM heatmap. Use OBS Studio or Windows Game Bar (Win+G) to record.

**Day 5 — Final review**
All three team members read the README together and check for anything missing or unclear.

**Day 6 — Final commit**
Make the final commit. Tag it as v1.0.0 on GitHub.

**Day 7 — Celebrate**
Project is done.

### Your deliverable to the team
Final polished README. Demo video recorded and linked in the README.

---

## Your Personal Weekly Sync Template

Every Sunday, answer these three questions in `team/week{N}_review.md`:

**1. What did I finish this week?**
List every file you wrote or modified. Be specific.

**2. What am I handing off to the team?**
What does Person B and C need from your work to continue their tasks next week?

**3. What do I need from Person B and Person C next week?**
Be specific — which file, which function, which output.

---

## Key Things to Remember Across All Weeks

**You own the data pipeline.** From raw HAM10000 image to processed tensor in a training batch — that entire chain is yours to understand inside out. If training crashes because of a data issue, you are the first person the team comes to.

**Coordinate embedding dimensions in week 5.** The cross-attention fusion layer needs all three branches to output the same size embedding. Agree this number before any branch code is written and write it in `team/API_CONTRACT.md`.

**Run ablation configs overnight.** Each training run takes hours. Start them before you sleep, check results in the morning. Do not sit watching the training loop.

**Never commit model checkpoint files.** They are hundreds of MB. Keep them in `ml/checkpoints/` which is in `.gitignore`. Share them with the team by copying the file directly.

**Your most important week is week 7.** The ablation study results are what makes your paper credible. Run all 7 configs carefully, record results accurately, do not skip any config.

---

*SkinFuseNet · Person A Plan · Week 3 to Project End*
