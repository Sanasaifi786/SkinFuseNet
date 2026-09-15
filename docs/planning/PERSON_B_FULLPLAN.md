# SkinFuseNet — Person B Complete Work Plan
### Week 3 to Project End

> **Your layer ownership this phase:** CLAHE pipeline → BERT tokenisation → Swin Transformer branch → Cross-attention fusion → Inference service → ResultsPanel  
> **Your strength to build:** You connect the ML model to the real world — your inference service is what makes the app actually work  
> **Golden rule:** Your inference service is the most critical backend piece. Test it with real images before handing off to Person A's router.

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

## WEEK 3 — CLAHE Pipeline

**Your job this week:** Build the CLAHE contrast enhancement script that runs on Person A's SAM-processed images and produces the final preprocessed images used for training.

### What you are building
A script called `clahe.py` that takes the SAM-masked images from `ml/data/processed/` and applies CLAHE contrast enhancement to produce final enhanced images saved to a new subfolder or in place. This runs after Person A's SAM pipeline completes.

### How to think about it
CLAHE (Contrast Limited Adaptive Histogram Equalization) makes subtle texture details more visible in dermoscopic images — especially important for dark skin tones or low-contrast lesions. It works on the L channel of LAB colour space so it enhances brightness contrast without distorting colours. You explored this in week 2 notebook — this week you scale it to all images.

### Day by day

**Day 1 — Coordinate with Person A**
Talk to Person A about the format of their SAM output. What resolution are the images saved at? What format — JPEG or PNG? What folder structure? Your CLAHE script takes their output as input so you need to know exactly what to expect. Write down the agreed format.

**Day 2 — Write clahe.py**
Write the script that loops through all SAM-processed images, applies CLAHE, and saves results. Use the same approach from the week 2 notebook but as a standalone script with a progress bar. Key parameters: clip_limit=2.0, tile_grid=(8,8) — these are the values from the paper.

**Day 3 — Test on 50 images**
Run on 50 images. Open them visually and compare before and after. The enhanced images should show more visible texture detail. If they look over-processed (very harsh, artificial-looking), reduce clip_limit to 1.5.

**Day 4 — Run on full dataset**
Run on all 10,015 images. This is much faster than SAM — should take 10-20 minutes. Check the output folder has the same number of files as input.

**Day 5 — Verify with dataset.py**
Point `dataset.py` to your CLAHE output folder and run the verification script. Confirm that images load correctly and have the right shapes and value ranges.

**Day 6 — Commit and document**
Write a clear comment block at the top of `clahe.py`. Commit to GitHub.

**Day 7 — Weekly review**

### Your deliverable to the team
`ml/src/preprocess/clahe.py` producing enhanced versions of all 10,015 images. Verified that dataset.py can load them correctly.

---

## WEEK 4 — BERT Tokenisation

**Your job this week:** Write the BERT tokenisation logic that converts patient metadata text into tokens that the BERT encoder can process. This is a critical piece — if tokenisation is wrong, the BERT branch cannot learn anything.

### What you are building
The tokenisation function in `ml/src/branches/bert.py` that takes age, sex, and localization as inputs, converts them into a natural language prompt, tokenises with the BERT tokenizer, and returns padded token tensors ready for the model.

### How to think about it
BERT does not understand numbers or categorical codes — it understands language. So you convert patient metadata into a sentence: "Patient: 45-year-old male. Lesion location: back." Then you tokenise this sentence into integer token IDs that BERT can process. The critical rule: always use padding and truncation with max_length=128, otherwise batches crash because sequences have different lengths.

### Day by day

**Day 1 — Understand BERT tokenisation**
Open a notebook and experiment. Load `bert-base-uncased` tokenizer from HuggingFace. Tokenise a few different metadata prompts. Print the token IDs, attention mask, and decoded tokens. Understand what padding does and what attention_mask tells the model.

**Day 2 — Design the prompt template**
The exact wording of the metadata prompt matters. The paper uses: "Patient: {age}-year-old {sex}. Lesion location: {location}." Try a few variations and check that tokenisation looks sensible. Keep it short — under 30 tokens so it fits well within max_length=128.

**Day 3 — Write the tokenisation function**
Write a function that takes age (int), sex (string), localization (string) and returns a dictionary with input_ids and attention_mask tensors. Always use padding='max_length', max_length=128, truncation=True, return_tensors='pt'.

**Day 4 — Test with a batch**
Test that the function works when called for multiple samples in a DataLoader batch. All token tensors in a batch must have the same shape — max_length=128 guarantees this. Verify shape is [batch_size, 128] for both input_ids and attention_mask.

**Day 5 — Integrate with dataset.py**
Work with Person A to add the tokenisation call into `dataset.py` so each sample returns input_ids and attention_mask alongside the image tensor. Verify the combined batch shapes are all correct.

**Day 6 — Commit**
Commit the tokenisation function and the updated dataset.py with comments.

**Day 7 — Weekly review**

### Your deliverable to the team
BERT tokenisation function producing correctly shaped and padded token tensors. Integrated into dataset.py so every batch includes input_ids and attention_mask.

---

## WEEK 5 — Swin Transformer V2 Branch

**Your job this week:** Build the ViT branch of SkinFuseNet — the Swin Transformer V2 model that captures global context and long-range spatial dependencies across the entire lesion image.

### What you are building
A Python class in `ml/src/branches/vit.py` that takes a batch of images as input and produces a feature embedding capturing global lesion context — things the CNN branch cannot see like the relationship between the lesion border and its centre.

### How to think about it
Swin Transformer V2 divides the image into patches and applies self-attention within local windows, then shifts windows to connect across the image. This gives it a global view that complements EfficientNetV2's local texture focus. You load it with pretrained ImageNet-21k weights, remove the classification head, and add a projection layer to the agreed embedding dimension.

### Day by day

**Day 1 — Load and explore Swin Transformer V2**
Load `swin_v2_s` from timm. Print all its layers. Find which layer is the feature extractor before the classification head. Note the output feature dimension — this is what you project down to the agreed embedding size.

**Day 2 — Confirm embedding dimension with team**
Before writing any class code, confirm the agreed embedding dimension with Person A (CNN branch) and Person C (BERT branch + fusion). All three must output the same size. Write this in `team/API_CONTRACT.md` if not already there.

**Day 3 — Write vit.py**
Write the class. Load Swin V2 with pretrained weights. Replace the head with a linear projection to the agreed embedding size. Write the forward method. Add `model.eval()` and `torch.no_grad()` guards in the test block.

**Day 4 — Test in isolation**
Run the test block with a random batch. Print output shape — should be [batch_size, embedding_dim]. Verify no errors.

**Day 5 — Verify with EfficientNetV2**
Run both CNN and ViT branches on the same batch. Check both output the exact same shape. This confirms they are compatible for fusion.

**Day 6 — Commit**
Commit `vit.py` with detailed comments explaining why Swin V2 complements the CNN branch.

**Day 7 — Weekly review**

### Your deliverable to the team
`ml/src/branches/vit.py` — a class that takes `[B, 3, 256, 256]` tensors and returns `[B, embedding_dim]` embeddings matching Person A's CNN output shape.

---

## WEEK 6 — Cross-Attention Fusion

**Your job this week:** Build the cross-attention fusion module that combines the three branch embeddings into one unified representation.

### What you are building
`ml/src/fusion.py` — a PyTorch module that takes the CNN embedding, ViT embedding, and metadata embedding from the three branches and fuses them using multi-head cross-attention into a single fused embedding for the classification head.

### How to think about it
Simple concatenation treats all three modalities equally. Cross-attention is smarter — it lets each modality selectively attend to relevant information from the other two. For example, when the image shows an ambiguous lesion, the model can attend to the patient metadata to resolve the ambiguity. You use PyTorch's built-in `nn.MultiheadAttention` module — do not implement attention from scratch.

### Day by day

**Day 1 — Understand cross-attention**
Read the cross-attention equation from the paper: CrossAttn(Q,K,V) = softmax(QKᵀ/√dk)V. In practical terms: one modality provides the Query, another provides the Key and Value. Open a notebook and experiment with `nn.MultiheadAttention` on small random tensors to see how it works.

**Day 2 — Design the fusion architecture**
Decide how to fuse three modalities. One approach: use CNN as Query attending to ViT (Key, Value), then attend the result to metadata. Another: concatenate all three then use self-attention. Discuss with Person C before deciding — they build the model assembly in week 6 that uses your fusion module.

**Day 3 — Write fusion.py**
Write the `CrossAttentionFusion` class. It takes three embedding tensors as input and returns one fused embedding. Include a feed-forward layer after attention (FFN from the paper). Add layer normalisation.

**Day 4 — Test fusion module**
Create three random tensors matching the agreed embedding dimensions. Pass through fusion. Verify output shape is correct. Check that the module has learnable parameters (print parameter count).

**Day 5 — Test with real branch outputs**
Connect all three branches and the fusion module in a notebook. Pass a real image batch through all three branches, then through fusion. Verify the full pipeline works end to end.

**Day 6 — Commit**
Commit `fusion.py` with comments explaining the design choice for how modalities are combined.

**Day 7 — Weekly review**

### Your deliverable to the team
`ml/src/fusion.py` — a module that takes three [B, embedding_dim] tensors and returns one [B, fused_dim] tensor. Tested with real branch outputs.

---

## WEEK 7 — Evaluation Metrics

**Your job this week:** Write the evaluation script that computes all performance metrics on the test set — accuracy, precision, recall, F1 per class, confusion matrix. These numbers go directly into your research paper.

### What you are building
`ml/src/evaluate.py` — a script that loads the best model checkpoint, runs it on the test set, and produces a complete performance report including the confusion matrix and per-class metrics table.

### How to think about it
Evaluation is not just accuracy. For a medical task with class imbalance, macro F1 and per-class recall are more important than overall accuracy. A model that gets 97% accuracy but misses all melanoma cases is dangerous. Your evaluation script must show all of this clearly.

### Day by day

**Day 1 — Design the evaluation report**
Write out on paper exactly what the report should contain. Overall accuracy. Macro precision, recall, F1. Per-class precision, recall, F1 (Table IV in paper). Normalised confusion matrix. These match Tables II, III, IV in your research paper exactly.

**Day 2 — Write evaluate.py**
Write the script. Load the best checkpoint. Run on test set. Use sklearn's `classification_report` and `confusion_matrix`. Save the confusion matrix as a PNG image. Print all numbers clearly.

**Day 3 — Run evaluation on best model**
Run evaluate.py on the best checkpoint from Person A's ablation runs. Record all numbers carefully — these go into the paper.

**Day 4 — Create visualisations**
Plot the normalised confusion matrix as a heatmap (like Figure 3 in the paper). Plot per-class precision and recall as a grouped bar chart (like Figure 5). Save both as PNG files in `ml/logs/`.

**Day 5 — Verify numbers match paper claims**
Check that your numbers are close to what the paper reports: 97.1% accuracy, 94.0% macro F1, MEL recall 94.2%. If they are significantly different, check that training ran correctly and the best checkpoint was used.

**Day 6 — Commit**
Commit `evaluate.py` and the generated charts. Write results into `team/final_results.md`.

**Day 7 — Weekly review**

### Your deliverable to the team
`ml/src/evaluate.py` producing full performance report. Confusion matrix and per-class chart images saved. All numbers recorded in `team/final_results.md`.

---

## WEEK 8 — Inference Service

**Your job this week:** Build the core inference service that loads the trained model and runs it on a new image at prediction time. This is the most critical backend component — everything the user sees comes from this.

### What you are building
`backend/app/services/inference.py` — a function called `run_inference()` that takes image bytes and patient metadata, preprocesses the image, runs the model forward pass, generates the GradCAM heatmap, and returns the prediction result.

### How to think about it
Inference time is different from training time. At training time you process thousands of images in batches on GPU with augmentation. At inference time you process one image at a time, no augmentation, as fast as possible. The model must be in eval mode. Gradients must be disabled except for GradCAM computation.

### Day by day

**Day 1 — Design the inference function signature**
Before coding, write out exactly what `run_inference()` takes as input and what it returns. Input: image bytes (raw bytes from uploaded file), age (int), sex (string), localization (string). Output: a Python dictionary matching the PredictionResponse Pydantic schema. Write this in a comment block first.

**Day 2 — Write image preprocessing at inference time**
The uploaded image needs the same preprocessing as training images: decode from bytes to PIL Image, apply SAM segmentation (or skip if too slow — SAM takes 10 seconds per image on CPU), apply CLAHE, resize to 256x256, convert to tensor, normalise with ImageNet stats. Decide with the team whether to run SAM at inference time or just CLAHE. Running SAM at inference adds ~10 second delay per request.

**Day 3 — Write the forward pass**
Load the model from `backend/models/skinfusenet.pt`. Set to eval mode. Disable gradients with `torch.no_grad()`. Tokenise the metadata with the same BERT tokenizer used in training. Run the forward pass. Convert output logits to probabilities with softmax. Get the predicted class and confidence.

**Day 4 — Write GradCAM generation**
GradCAM requires gradients so it cannot be inside `torch.no_grad()`. Use the `grad-cam` library with `GradCAM` class targeting the last convolutional layer of the EfficientNetV2 branch specifically. Generate the heatmap, overlay it on the original image, encode as base64 PNG string.

**Day 5 — Test run_inference() in isolation**
Call `run_inference()` directly in a Python script (not through the API) with a real HAM10000 image. Verify the output dictionary has all required fields and correct types.

**Day 6 — Commit**
Commit `inference.py` with detailed comments explaining each step and why it is done that way.

**Day 7 — Weekly review**

### Your deliverable to the team
`backend/app/services/inference.py` with a working `run_inference()` function tested on real images. Documented inference time per image.

---

## WEEK 9 — GradCAM Backend Integration

**Your job this week:** Make GradCAM work reliably for all 7 lesion classes and ensure the heatmap output is always a valid base64 PNG that the frontend can display.

### What you are building
Robust GradCAM generation that works for every prediction class, handles edge cases gracefully, and always returns a displayable image even if GradCAM fails.

### How to think about it
GradCAM can fail silently — it returns a blank image with no error if the target layer is wrong. Your job is to make sure the target layer is correct, the heatmap is meaningful, and if anything goes wrong you return the original image instead of a broken base64 string.

### Day by day

**Day 1 — Verify GradCAM target layer**
This is the most common GradCAM mistake. The target layer must be the last convolutional layer in the EfficientNetV2 branch specifically. Print the model's layer names and identify the exact layer. Test that GradCAM produces a non-blank heatmap on a real image.

**Day 2 — Test GradCAM for all 7 classes**
Test GradCAM on one example from each of the 7 lesion classes. Verify the heatmap looks clinically sensible — for melanoma it should highlight irregular borders and asymmetric colour regions, not random patches.

**Day 3 — Add fallback for GradCAM failure**
If GradCAM fails for any reason, catch the exception and return the original preprocessed image as the gradcam_image instead. This ensures the API never crashes because of GradCAM.

**Day 4 — Optimise heatmap quality**
The default GradCAM overlay can be hard to see. Experiment with the alpha value (transparency of heatmap overlay). Use a clinically appropriate colourmap — jet or turbo work well for medical visualisations.

**Day 5 — Test base64 encoding**
Take the base64 string your function returns and paste it into an online base64 image decoder. Verify it shows a real heatmap overlay. This confirms the frontend will be able to display it.

**Day 6 — Commit**
Commit updated GradCAM code with fallback handling.

**Day 7 — Weekly review**

### Your deliverable to the team
Reliable GradCAM generation for all 7 classes with fallback. Verified that base64 strings decode to real heatmap images.

---

## WEEK 10 — ResultsPanel Component

**Your job this week:** Build the React component that displays the prediction result to the user — the most important piece of the frontend because it is what users come to see.

### What you are building
`frontend/src/components/ResultsPanel.jsx` — displays the predicted class name with a severity badge, the confidence percentage, and a brief clinical description of the predicted class.

### How to think about it
This is a medical result display. It must be clear, unambiguous, and appropriately serious. The predicted class should be prominent. The confidence should be visible. For malignant classes (MEL, BCC, AKIEC) there should be a visual indicator that this is a high-risk result. For benign classes (NV, DF) the visual should be calmer.

### Day by day

**Day 1 — Design on paper first**
Before opening VS Code, draw what the results panel should look like on paper. What is the biggest element? What colour is a melanoma result vs a nevi result? What text appears below the class name? Get feedback from Person A and C before building.

**Day 2 — Write class metadata**
Create a JavaScript object mapping each class code to its full name, severity level, and a one-line description. Example: MEL maps to "Melanoma", severity "high", description "Potentially malignant. Dermatologist consultation recommended urgently." NV maps to "Melanocytic Nevi", severity "low", description "Typically benign mole. Monitor for changes."

**Day 3 — Build the component**
Build `ResultsPanel.jsx`. Show the class full name, severity badge (red for high risk, green for low), confidence as a percentage bar, and the clinical description. Also show the disclaimer that this is not a clinical diagnosis.

**Day 4 — Style for clarity**
Make high-risk results visually distinct — red border, warning icon. Make low-risk results calmer — green border, check icon. Test with different mock class values by temporarily hardcoding them.

**Day 5 — Mobile responsiveness**
Check on small screen. Results should be easy to read without scrolling horizontally.

**Day 6 — Commit**
Commit `ResultsPanel.jsx` with comments.

**Day 7 — Weekly review**

### Your deliverable to the team
`frontend/src/components/ResultsPanel.jsx` — clean, clinically appropriate result display with severity indicators.

---

## WEEK 11 — Loading + Error States

**Your job this week:** Make the app feel professional during the waiting period (5-10 seconds while model runs inference) and show clear, helpful error messages when things go wrong.

### What you are building
Loading state UI that reassures users the app is working. Error state UI that tells users exactly what went wrong and how to fix it.

### How to think about it
5-10 seconds is a long time for a user to wait without feedback. If nothing happens, they think the app is broken. A good loading state shows progress, reassures the user, and sets expectations. Error messages should be written in plain language — not "HTTP 422 Unprocessable Entity" but "Please fill in the patient age before submitting."

### Day by day

**Day 1 — Design loading state**
Think about what to show during the 5-10 second inference wait. A spinner alone is not enough. Add text that changes: "Preprocessing image...", "Running analysis...", "Generating explanation..." — this makes the wait feel shorter.

**Day 2 — Build loading component**
Build the loading UI. Use a CSS animation for the spinner. Show the rotating messages. Make it visually consistent with the rest of the app.

**Day 3 — Map backend errors to friendly messages**
Create a mapping from HTTP status codes and error detail strings to user-friendly messages. 400 with "Only JPEG" → "Please upload a JPEG or PNG image." 413 → "Your image is too large. Please use an image under 10MB." 500 → "The analysis server encountered an error. Please try again in a moment."

**Day 4 — Build error component**
Build the error display. Show the friendly message prominently. Show a "Try again" button that resets the form. Do not show technical error details to the user.

**Day 5 — Test all error scenarios**
Go through every error case. Trigger each one from the frontend and verify the right friendly message appears.

**Day 6 — Commit**

**Day 7 — Weekly review**

### Your deliverable to the team
Professional loading state with rotating messages. Friendly error messages for all error cases. "Try again" functionality.

---

## WEEK 12 — Bug Fixing

**Your job this week:** Work through the integration test failures found by Person A and fix every bug that touches the inference service, GradCAM, or ResultsPanel.

### How to think about it
Integration testing often reveals bugs that unit testing missed. Common ones in this project: GradCAM base64 string has extra whitespace that breaks img src in React. Model on GPU but image tensor on CPU. BERT tokens not on the same device as the model. Probability values do not sum exactly to 1.0 due to floating point.

### Day by day

**Day 1-2 — Fix inference bugs**
Work through any failures in the inference service. Check device consistency — all tensors and model must be on the same device (all CPU or all GPU).

**Day 3-4 — Fix GradCAM bugs**
If GradCAM images are not displaying in the browser, check the base64 string format. It must be a plain base64 string without any prefix. In React, display it as `<img src={"data:image/png;base64," + result.gradcam_image} />`.

**Day 5-6 — Fix ResultsPanel bugs**
If results are not displaying correctly, check that the component handles all 7 class codes and that the severity mapping is complete.

**Day 7 — Confirm all bugs fixed and weekly review**

---

## WEEK 13 — Deployment

**Your job this week:** Deploy the application so it is accessible publicly for the demo and paper submission.

### What you are building
A publicly accessible URL where anyone can use SkinFuseNet without installing anything locally.

### How to think about it
Hugging Face Spaces is the easiest option for ML apps — free, GPU available on some plans, and widely used for research demos. If GPU inference is too slow on free tier, deploy the backend on Render (free tier) with CPU inference and accept the longer wait time.

### Day by day

**Day 1-2 — Set up Hugging Face Spaces**
Create an account at huggingface.co. Create a new Space with Docker SDK. Push the docker-compose setup to the Space.

**Day 3-4 — Fix deployment issues**
Deployment almost always has issues — missing environment variables, wrong port, model file not included. Work through them one by one.

**Day 5 — Test deployed version**
Test the live URL with real images. Verify predictions are correct and GradCAM displays.

**Day 6 — Add deployment URL to README**
Add the live demo URL to the main README.

**Day 7 — Done**

---

## Your Personal Weekly Sync Template

Every Sunday, answer these in `team/week{N}_review.md`:

**1. What did I finish this week?**
**2. What am I handing off to the team?**
**3. What do I need from Person A and Person C next week?**

---

## Key Things to Remember Across All Weeks

**Your inference service is the heart of the app.** Everything the user sees comes from `run_inference()`. Test it thoroughly before handing to Person A's router.

**Always use padding in BERT tokenisation.** `padding='max_length', max_length=128, truncation=True` — every single time. Missing this causes DataLoader to crash with a size mismatch error that is very confusing to debug.

**GradCAM target layer is critical.** If you point GradCAM at the wrong layer you get a blank white image with no error. Always verify visually that the heatmap is non-blank.

**Device consistency in inference.** If your model is on GPU, every tensor must be on GPU. If any tensor is on CPU while the model is on GPU, you get a CUDA device mismatch error. Always call `.to(device)` on every tensor before the forward pass.

**Your most important week is week 8.** The inference service determines whether the app works at all. Do not rush it.

---

*SkinFuseNet · Person B Plan · Week 3 to Project End*
