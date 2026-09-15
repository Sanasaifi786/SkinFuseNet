# SkinFuseNet - Week 7
### Training + Ablation Study — 7 training configs — Evaluation — TorchScript export

> **Phase:** ML - Training  
> **Weeks done:** 1 ✅ · 2 ✅ · 3 ✅ · 4 ✅ · 5 ✅ · 6 ✅ · **7 ← you are here**  
> **Time needed:** 10-15 hrs across the week  
> **Prerequisite:** Week 6 complete - full SkinFuseNet forward pass working, train.py running

---

## 🔄 Current Status (Updated August 29, 2026)

| Task | Owner | Status |
|---|---|---|
| `train.py` training loop ready | Person A | ✅ **Done** — mock model in place |
| Real `SkinFuseNetModel` plugged into `train.py` | All | ❌ **Blocked** — needs `model.py` (Person C) |
| 7 ablation training runs | Person A | ❌ **Not started** |
| `team/ablation_results.md` | Person A | ❌ **Missing** |
| `ml/src/evaluate.py` | Person B | ❌ **Empty** — not started |
| `team/final_results.md` | Person B | ❌ **Missing** |
| `ml/src/export.py` (TorchScript) | Person C | ❌ **Empty** — not started |
| `team/model_export_guide.md` | Person C | ❌ **Missing** |
| `team/week7_review.md` | Team | ❌ **Missing** |

> **This entire week is blocked until Week 6 (model.py, fusion.py, loss.py) is complete.**

## Week 7 Goal

All 7 ablation configs completed. Best model exported as skinfusenet.pt. Results table committed. Confusion matrix and per-class charts saved.

---

## Before Day 1

PLAN THE ABLATION RUN SCHEDULE ON DAY 1

Each training config takes 6-12 hours on GPU. You have 7 configs.
Plan which config runs on which night:
- Night 1: Config 1 (CNN only)
- Night 2: Config 2 (+Swin)
- Night 3: Config 3 (+BERT)
- Night 4: Config 4 (+SAM)
- Night 5: Config 5 (+Focal loss)
- Night 6: Config 6 (+Augmentation)
- Night 7: Config 7 (Full model — 100 epochs)

Create config.yaml with boolean flags. Person A changes flags between runs.

---

## Tasks by Person

### Person A — Ablation Study — 7 Configs
**File:** `ml/config.yaml + ablation runs`

**Step by step:**
1. Create ml/config.yaml: use_vit: false, use_bert: false, use_sam: false, use_focal_loss: false, use_augmentation: false
2. Update train.py to read config.yaml and enable/disable components accordingly
3. Config 1 (CNN only): all flags false. Start before sleeping. Check W&B next morning. Record accuracy + macro F1.
4. Config 2 (+Swin): set use_vit: true. Run overnight. Record results.
5. Config 3 (+BERT): add use_bert: true. Run overnight.
6. Config 4 (+SAM): add use_sam: true (use processed images). Run overnight.
7. Config 5 (+Focal loss): add use_focal_loss: true. Run overnight.
8. Config 6 (+Augmentation): add use_augmentation: true. Run overnight.
9. Config 7 (Full): all flags true. Run 100 epochs with early stopping — this is the most important run.
10. After each run: write results to team/ablation_results.md immediately

**Why this matters:** The ablation study proves that each component contributes measurably. Without it, reviewers could argue your gains come from one lucky choice. The table shows the additive contribution of each component — this is Table III in your research paper.

---

### Person B — Evaluation Metrics + Charts
**File:** `ml/src/evaluate.py`

**Step by step:**
1. Load best checkpoint from ml/checkpoints/best_model.pt
2. Run on test set ONLY — never evaluate on training or validation data
3. Compute with sklearn: accuracy_score, classification_report (per-class P/R/F1), confusion_matrix
4. Plot confusion matrix: normalised heatmap with seaborn. Save to ml/logs/confusion_matrix.png
5. Plot per-class chart: grouped bar chart of precision + recall for all 7 classes. Save to ml/logs/per_class_metrics.png
6. Write team/final_results.md with: overall accuracy, macro F1, per-class table, paths to chart images
7. All 3 people review the numbers together — verify they match paper claims

**Why this matters:** Evaluation on the held-out test set (never seen during training) is the only honest measure of model performance. Per-class metrics matter more than overall accuracy for this imbalanced dataset — a model that scores 97% overall but misses all DF cases is not useful.

---

### Person C — TorchScript Export
**File:** `ml/src/export.py`

**Step by step:**
1. Wait for Person A's Config 7 (full model) to finish training
2. Load best checkpoint: model = SkinFuseNet(...); model.load_state_dict(torch.load(checkpoint)['model_state_dict'])
3. Set eval mode: model.eval()
4. Try torch.jit.trace first: traced = torch.jit.trace(model, (example_image, example_ids, example_masks))
5. If trace fails: try torch.jit.script(model) instead
6. Save: torch.jit.save(traced, 'backend/models/skinfusenet.pt')
7. Verify: loaded = torch.jit.load('backend/models/skinfusenet.pt'); run forward pass; compare output to original model. Difference must be < 1e-4.
8. Confirm Person B can load skinfusenet.pt in backend WITHOUT importing any ml/ code

**Why this matters:** TorchScript serialises the model's computation graph and weights into a standalone binary. The backend server can load and run it without needing any of the training codebase — clean separation between ML and serving.

---

## Daily Breakdown

| Day | Focus | Who |
|-----|-------|-----|
| Mon | Plan ablation schedule. Create config.yaml. Start Config 1 (CNN only) overnight. | A |
| Tue | A: check Config 1 results, start Config 2 (+Swin) overnight. B: start evaluate.py. | A overnight + B |
| Wed | A: Config 3 (+BERT). B: finish evaluate.py. C: start export.py. | Each independently |
| Thu | A: Configs 4+5 overnight. C: test export on intermediate checkpoint. | A overnight + C |
| Fri | A: Configs 6+7 (full model). B: run evaluate.py on best checkpoint. | A overnight + B |
| Sat | All 3: review ablation results table together. Verify numbers match paper. | All 3 together |
| Sun | C: export best model. Copy to backend/models/. Verify Person B can load it. | C delivers .pt file |

---

## Week 7 Checklist

### Person A
- [ ] Create ml/config.yaml: use_vit: false, use_bert: false, use_sam: false, use_foca...
- [ ] Update train.py to read config.yaml and enable/disable components accordingly
- [ ] Config 1 (CNN only): all flags false. Start before sleeping. Check W&B next morn...
- [ ] Config 2 (+Swin): set use_vit: true. Run overnight. Record results.
- [ ] Config 3 (+BERT): add use_bert: true. Run overnight.

### Person B
- [ ] Load best checkpoint from ml/checkpoints/best_model.pt
- [ ] Run on test set ONLY — never evaluate on training or validation data
- [ ] Compute with sklearn: accuracy_score, classification_report (per-class P/R/F1), ...
- [ ] Plot confusion matrix: normalised heatmap with seaborn. Save to ml/logs/confusio...
- [ ] Plot per-class chart: grouped bar chart of precision + recall for all 7 classes....

### Person C
- [ ] Wait for Person A's Config 7 (full model) to finish training
- [ ] Load best checkpoint: model = SkinFuseNet(...); model.load_state_dict(torch.load...
- [ ] Set eval mode: model.eval()
- [ ] Try torch.jit.trace first: traced = torch.jit.trace(model, (example_image, examp...
- [ ] If trace fails: try torch.jit.script(model) instead

### Team
- [ ] All files committed and pushed to GitHub
- [ ] team/week7_review.md written and committed
- [ ] Each person can explain their week's work to the other two

---

## Common Errors This Week

### torch.jit.trace TracerWarning
**Fix:** These are warnings, not errors, and the trace usually still works. If the output is wrong after tracing, try torch.jit.script instead.

### CUDA out of memory during training
**Fix:** Reduce batch_size from 32 to 16 in config. Or add gradient accumulation: accumulate gradients over 2 mini-batches to simulate batch_size=32.

### W&B run not appearing in dashboard
**Fix:** Check you called wandb.init() before the training loop, not inside it. Also check internet connection.

### Checkpoint file cannot be loaded
**Fix:** If torch.load() gives an error, the checkpoint was saved incompletely (training interrupted). Check file size — a valid checkpoint should be several hundred MB.

---

## Deliverable

team/ablation_results.md with all 7 configs. backend/models/skinfusenet.pt. ml/logs/ with confusion matrix and per-class charts. team/final_results.md.

---

*SkinFuseNet · Week 7 · All 3 team members*