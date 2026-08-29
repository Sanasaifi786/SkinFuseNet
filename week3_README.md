# SkinFuseNet — Week 3
### SAM Full Preprocessing Pipeline · CLAHE Enhancement · Augmentation

> **Phase:** ML Preprocessing  
> **Weeks done:** 1 ✅ · 2 ✅ · **3 ← you are here**  
> **Time needed:** 10–15 hrs across the week  
> **Prerequisite:** Week 2 complete — dataset.py working, SAM tested on one image, mock API live

---

## 🔄 Current Status (Updated August 29, 2026)

| Task | Owner | Status |
|---|---|---|
| `sam_preprocess.py` script | Person A | ✅ **Written** — ready to run on full dataset |
| `clahe.py` script | Person B | ✅ **Written** — ready to run once SAM output exists |
| `augmentation.py` (MixUp/CutMix/RSPDA) | Person C | ❌ **Empty** — needs implementing |
| `dataset.py` updated to load from `processed/` | Person A | ✅ **Done** |
| Full dataset run (10,015 images) | Person A | ⏳ **Blocked** — needs HAM10000 metadata CSV first |
| `verify_dataset.py` passing | Team | ⏳ **Blocked** — script written, awaiting data |
| `team/week3_review.md` | Team | ❌ **Missing** |

> **Next action for Person A:** Download HAM10000 metadata CSV from Kaggle → `ml/data/raw/HAM10000_metadata.csv`, then run `python src/preprocess/sam_preprocess.py`

---

## Week 3 Goal

By end of this week all 10,015 HAM10000 images must be preprocessed and saved to disk. The augmentation pipeline must be ready. `dataset.py` must be updated to load from processed images. This is the last week before model building starts — the data pipeline must be solid.

---

## Before Day 1 — All Three Together (30 mins)

**Person A and Person B must agree on this before writing a single line:**

- What folder do processed images save to? → `ml/data/processed/`
- What format? → JPEG, quality 95
- What resolution? → Save at original resolution (not resized yet — `dataset.py` handles resize)
- What filename? → Same as original `image_id` from HAM10000 CSV e.g. `ISIC_0024306.jpg`

Write these decisions in `team/preprocessing_contract.md` and commit it. Person B's CLAHE script reads Person A's output — if the format is wrong, Person B's week is wasted.

---

## Day 1 — Monday · Coordination + Script Planning

**All 3 people · ~2 hrs**

### Person A
- Open week 2 SAM notebook
- Write `sam_preprocess.py` as an empty file with detailed pseudocode comments first
- List every edge case: what if SAM finds 0 segments? What if SAM finds 100? What if image is corrupt?
- Design the fallback: if SAM fails → use full image, resize to 256×256, save as-is
- Do not write real code yet — plan first

### Person B
- Read the preprocessing_contract.md
- Open week 2 CLAHE notebook
- Confirm you understand the input format from Person A
- Write `clahe.py` as empty file with pseudocode comments
- List the exact OpenCV steps: load → RGB to LAB → CLAHE on L channel → LAB to RGB → save

### Person C
- Open week 2 augmentation work
- Research MixUp formula: `x̃ = λx_i + (1-λ)x_j` where `λ ~ Beta(α, α)`
- Research CutMix: random rectangle from image A pasted onto image B, labels mixed by area ratio
- Research RSPDA: rotation at 0°/90°/180°/270° + random translation up to 10% of image size
- Write `augmentation.py` as empty file with detailed pseudocode comments for all 3 methods

---

## Day 2 — Tuesday · Write the Scripts

**Each person writes their own script · ~3 hrs**

### Person A — Write sam_preprocess.py

Create `ml/src/preprocess/sam_preprocess.py`:

**What the script does step by step:**
1. Load HAM10000 metadata CSV to get all image IDs
2. For each image ID, find the image file in `HAM10000_images_part_1` or `part_2`
3. Load the image as a numpy RGB array
4. Run SAM automatic mask generation to find all segments
5. Pick the best segment — largest one near the centre of the image
6. Apply the mask: set everything outside the lesion to black
7. If SAM fails or finds no segment: use the full image as-is (fallback)
8. Save the result to `ml/data/processed/{image_id}.jpg`
9. Log any failures to `ml/logs/sam_failures.txt`
10. Print progress with tqdm

**Key settings for SAM:**
- `points_per_side=16` (lower than default to speed up)
- `pred_iou_thresh=0.88`
- `stability_score_thresh=0.95`
- `min_mask_region_area=500` (ignore tiny segments like individual hairs)

**Lesion selection strategy:**
```
For each segment found:
    score = (area / total_pixels) - 0.3 * (distance_from_centre / max_distance)
    
Pick the segment with the highest score
```
This picks large segments near the centre — where the lesion almost always is in dermoscopic images.

**Test on 10 images before running on full dataset.**

---

### Person B — Write clahe.py

Create `ml/src/preprocess/clahe.py`:

**What the script does step by step:**
1. Loop through all images in `ml/data/processed/` (Person A's output)
2. For each image:
   - Load with OpenCV: `cv2.imread(path)` — note OpenCV loads BGR not RGB
   - Convert BGR to RGB: `cv2.cvtColor(img, cv2.COLOR_BGR2RGB)`
   - Convert RGB to LAB: `cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)`
   - Create CLAHE: `cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))`
   - Apply only to L channel: `lab[:,:,0] = clahe.apply(lab[:,:,0])`
   - Convert back: `cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)`
   - Save back to same path (overwrite in place): `cv2.imwrite(path, enhanced)`
3. Print progress with tqdm
4. Count and print: "Enhanced X images successfully"

**Why L channel only:**
LAB colour space separates lightness (L) from colour (A=green-red axis, B=blue-yellow axis). Applying CLAHE only to L means we enhance contrast without shifting colours — critical because lesion colour patterns are diagnostically important.

---

### Person C — Write augmentation.py

Create `ml/src/preprocess/augmentation.py`:

**MixUp implementation:**
```
Input: image1 [3,H,W], label1 (int), image2 [3,H,W], label2 (int)
1. Sample lambda from Beta(0.4, 0.4)
2. mixed_image = lambda * image1 + (1 - lambda) * image2
3. Convert labels to one-hot vectors of size 7
4. mixed_label = lambda * label1_onehot + (1-lambda) * label2_onehot
5. Return mixed_image, mixed_label (soft label)
```

**CutMix implementation:**
```
Input: image1 [3,H,W], label1 (int), image2 [3,H,W], label2 (int)
1. Sample cut_ratio = sqrt(1 - Beta(1.0, 1.0))
2. cut_h = H * cut_ratio, cut_w = W * cut_ratio
3. Random centre point (cx, cy)
4. Compute rectangle: x1=cx-cut_w/2, y1=cy-cut_h/2, x2=cx+cut_w/2, y2=cy+cut_h/2
5. Clip to image boundaries
6. mixed_image = copy of image1 with rectangle replaced by image2's rectangle
7. lam = 1 - (cut area / total area)
8. mixed_label = lam * label1_onehot + (1-lam) * label2_onehot
9. Return mixed_image, mixed_label
```

**RSPDA implementation:**
```
Input: image [3,H,W]
1. Randomly pick angle from [0, 90, 180, 270]
2. Rotate image by that angle
3. Random shift dx = uniform(-0.1*W, 0.1*W), dy = uniform(-0.1*H, 0.1*H)
4. Apply translation using affine transform
5. Return transformed image, same label (no label mixing for RSPDA)
```

**Dispatcher function:**
```
apply_augmentation(image1, label1, image2, label2, aug_type):
    if aug_type == 'mixup'  → return mixup(...)
    if aug_type == 'cutmix' → return cutmix(...)
    if aug_type == 'rspda'  → return rspda(image1), label1
    else                    → return image1, label1 (no augmentation)
```

---

## Day 3 — Wednesday · Test on Small Sample

**Each person tests their script on 50 images · ~2 hrs**

### Person A — Test SAM on 50 images
```bash
# Run only on first 50 image IDs
python ml/src/preprocess/sam_preprocess.py --limit 50
```
- Open 10 output images in an image viewer or Jupyter notebook
- Each should show: lesion visible, background blacked out, no artifacts
- Check `ml/logs/sam_failures.txt` — how many of the 50 used fallback?
- If more than 5 out of 50 are failing, the segment selection strategy needs fixing

### Person B — Test CLAHE on 50 images
- Run `clahe.py` on the first 50 processed images from Person A
- Open a Jupyter notebook, display 5 before/after pairs side by side
- Enhanced images should show more visible texture detail
- If the enhancement looks too harsh or artificial, reduce `clipLimit` from 2.0 to 1.5

### Person C — Test augmentations visually
- Open a notebook: `ml/notebooks/week3_augmentation_test.ipynb`
- Load any 2 real HAM10000 images as tensors
- Run MixUp 3 times — display all 3 results. Should look like ghost overlay of 2 lesions
- Run CutMix 3 times — display all 3. Should show rectangle patch from one image pasted on other
- Run RSPDA 6 times (one per rotation + 2 shifts) — display results
- Save all examples to `ml/notebooks/augmentation_examples/`

---

## Day 4 — Thursday · Run on Full Dataset

**Day 3 tests passed → now run on all 10,015 · Each person independently**

### Person A — Full SAM run
```bash
# Start this before going to sleep
python ml/src/preprocess/sam_preprocess.py
```
- On GPU: takes approximately 2–3 hours
- On CPU: takes approximately 28–30 hours (do not use CPU for full run)
- Check back next morning
- Verify: `ls ml/data/processed/ | wc -l` should show ~10015
- Check failure log: `cat ml/logs/sam_failures.txt | wc -l` — how many fell back?

### Person B — Wait for Person A
Person A's processed images must exist before Person B can run CLAHE.
- If Person A is still running: work on understanding the BERT tokenisation for week 4
- Once Person A's output is available: `python ml/src/preprocess/clahe.py`
- CLAHE is much faster than SAM — takes 10–20 minutes for all 10,015 images

### Person C — Polish augmentation.py
- Add input validation: check image tensor has correct shape `[3, H, W]`
- Add probability parameter: `apply_augmentation(..., prob=0.5)` — only augment with 50% chance
- Save visual examples: write code at bottom of file that loads 2 images and saves examples of all 3 methods

---

## Day 5 — Friday · Review Outputs + Cross-Check

**All 3 together · ~2 hrs**

### Visual quality check — Person A and B together
Open 20 random processed images from `ml/data/processed/`. For each one:
- Does the lesion region look correct (not clipped too tight, not too loose)?
- Is the background blacked out cleanly?
- Does the CLAHE enhancement look natural (not over-processed)?

If any category of errors is systematic (e.g. SAM always fails on certain lesion types), document it in `team/preprocessing_notes.md`.

### Update dataset.py — Person A
Update the image path finding logic in `dataset.py` to look in `ml/data/processed/` instead of the raw image folders:
```python
# Old:
path = os.path.join(raw_folder, f"{image_id}.jpg")

# New:
path = os.path.join("ml/data/processed", f"{image_id}.jpg")
```
Run `verify_dataset.py` to confirm images load correctly.

### Commit all scripts — all 3
```bash
git add ml/src/preprocess/
git add ml/notebooks/augmentation_examples/
git add team/preprocessing_contract.md
git commit -m "feat: week 3 preprocessing pipeline complete — SAM, CLAHE, augmentation"
git push
```

---

## Day 6 — Saturday · Fix Issues + Documentation

**Each person · ~1.5 hrs**

### Person A — Document sam_preprocess.py
Add a comment block at the top of the file:
```python
"""
sam_preprocess.py
-----------------
Runs SAM (Segment Anything Model) on all HAM10000 images to isolate
the lesion region and remove artifacts (hair, rulers, ink annotations).

Input:  HAM10000 raw images in ml/data/raw/HAM10000_images_part_1/ and part_2/
Output: Lesion-cropped images in ml/data/processed/{image_id}.jpg

Fallback: If SAM fails to find a valid segment, the full image is saved
          resized to 256x256 without masking. Failures logged to
          ml/logs/sam_failures.txt.

Runtime: ~2-3 hours on NVIDIA RTX 3090 (GPU).
         ~28 hours on CPU — always use GPU for full run.
"""
```

### Person B — Document clahe.py
Same format — add a comment block explaining input, output, parameters, and why CLAHE is applied to L channel only.

### Person C — Write augmentation guide
Create `ml/notebooks/augmentation_guide.md` explaining in plain English what each method does and when to use which one. Include the visual examples as references.

---

## Day 7 — Sunday · Weekly Review

**All 3 together · 30 mins**

Each person answers:
1. What did I finish this week?
2. What problems did I run into and how did I solve them?
3. What does the team need from me before week 4 starts?

Write answers in `team/week3_review.md` and commit.

---

## Week 3 Checklist

Go through every item. All must be ticked before starting Week 4.

### Setup
- [ ] `team/preprocessing_contract.md` written and committed
- [ ] `ml/data/processed/` folder exists  *(create after running SAM)*
- [ ] `ml/logs/` folder exists

### Person A — SAM
- [x] `sam_preprocess.py` written and committed  ✅
- [ ] Tested on 50 images — visual check passed
- [ ] Run on full 10,015 images — completed *(blocked: download HAM10000 CSV first)*
- [ ] `ml/data/processed/` shows ~10015 files
- [ ] `sam_failures.log` exists showing fallback count
- [x] `dataset.py` updated to load from `ml/data/processed/`  ✅

### Person B — CLAHE
- [x] `clahe.py` written and committed  ✅
- [ ] Run on all processed images — completed *(blocked: wait for Person A's SAM output)*
- [ ] Before/after visual comparison done
- [ ] `dataset.py` can load CLAHE-enhanced images without errors

### Person C — Augmentation
- [ ] `augmentation.py` written with MixUp, CutMix, RSPDA  ⚠️ **FILE IS EMPTY — NEEDS IMPLEMENTATION**
- [ ] Visual examples saved to `ml/notebooks/augmentation_examples/`
- [ ] All 3 methods return correct tensor shapes
- [ ] `apply_augmentation()` dispatcher function works

### Team
- [ ] `verify_dataset.py` runs without errors on processed images *(script written, needs data)*
- [ ] `team/week3_review.md` committed

---

## Common Errors This Week

### SAM: "CUDA out of memory"
```
RuntimeError: CUDA out of memory
```
**Fix:** Reduce `points_per_side` from 16 to 8. This halves the number of prompt points and significantly reduces GPU memory usage.

### SAM: Takes too long
**Symptom:** Each image taking more than 30 seconds  
**Fix:** Confirm GPU is being used: `python -c "import torch; print(torch.cuda.is_available())"` must print `True`. If `False`, PyTorch CUDA is not installed — reinstall with the correct `--index-url`.

### CLAHE: ImportError for cv2
```
ModuleNotFoundError: No module named 'cv2'
```
**Fix:** `pip install opencv-python` — but check which venv is active first. If you need it in the backend too, use `opencv-python-headless` there instead.

### CLAHE: Images look the same before and after
**Symptom:** CLAHE does not seem to change anything  
**Cause:** You applied CLAHE to all 3 channels instead of just L channel  
**Fix:** Convert to LAB first, apply only to `lab[:,:,0]`, then convert back

### Augmentation: "Expected float tensor"
```
RuntimeError: expected scalar type Float but found Byte
```
**Fix:** After loading an image with PIL and calling `ToTensor()`, the output is `float32` with values 0–1. If you loaded with OpenCV, convert: `tensor = torch.from_numpy(img).float() / 255.0`

### dataset.py: "Image not found" after updating path
**Symptom:** `verify_dataset.py` fails with FileNotFoundError after pointing to processed folder  
**Fix:** Check the filename format. HAM10000 image IDs from the CSV do not include the `.jpg` extension — you must add it: `f"{image_id}.jpg"`

---

## What Week 4 Needs From This Week

Week 4 (Dataset Finalisation) requires:
- `ml/data/processed/` containing all 10,015 images ← Person A + B must deliver this
- `augmentation.py` working ← Person C must deliver this
- `dataset.py` loading from processed images ← Person A must deliver this

Do not start week 4 until all three deliverables above are committed and verified.

---

## Resources

| Resource | What it covers | Link |
|----------|---------------|------|
| SAM GitHub | Official SAM docs and examples | github.com/facebookresearch/segment-anything |
| OpenCV CLAHE | `cv2.createCLAHE` documentation | docs.opencv.org |
| MixUp paper | Original MixUp method | arxiv.org/abs/1710.09412 |
| CutMix paper | Original CutMix method | arxiv.org/abs/1905.04899 |
| CampusX (Hindi) | OpenCV tutorial in Hindi | YouTube → search "CampusX OpenCV" |

---

*SkinFuseNet · Week 3 · All 3 team members*