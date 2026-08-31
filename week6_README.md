# SkinFuseNet - Week 6
### Model Assembly + Focal Loss â€” Cross-attention fusion â€” Full SkinFuseNet model â€” Training loop

> **Phase:** ML - Model Assembly  
> **Weeks done:** 1 âœ… Â· 2 âœ… Â· 3 âœ… Â· 4 âœ… Â· 5 âœ… Â· **6 â† you are here**  
> **Time needed:** 10-15 hrs across the week  
> **Prerequisite:** Week 5 complete - cnn.py, vit.py, bert.py all producing [B, 512] output

---

## ðŸ”„ Current Status (Updated August 29, 2026)

| Task | Owner | Status |
|---|---|---|
| `ml/src/train.py` (mixed precision, AdamW, CosineAnnealing) | Person A | âœ… **Done** â€” Mock model stub in place |
| `ml/src/fusion.py` (cross-attention fusion) | Person B | âŒ **Empty** â€” not started |
| `ml/src/loss.py` (focal loss + label smoothing) | Person C | âŒ **Empty** â€” not started |
| `ml/src/model.py` (full `SkinFuseNetModel` assembly) | Person C | âŒ **Empty** â€” not started |
| Fake-data forward/backward integration test | Team | âŒ **Pending** |
| `team/week6_review.md` | Team | âŒ **Missing** |

> **Note:** `train.py` uses a `MockSkinFuseNetModel` (CNN-only). Once Person C finishes `model.py` and Person B finishes `fusion.py`, swap the import in `train.py` to use the real `SkinFuseNetModel`.

## Week 6 Goal

Complete SkinFuseNet model assembled and running a forward pass on GPU. Training loop skeleton running one epoch without errors. Focal loss verified against CrossEntropy.

---

## Before Day 1

âš ï¸ MOST COORDINATION-HEAVY WEEK

Person C needs cnn.py (A) and vit.py + fusion.py (B) to assemble model.py.
Person A needs model.py (C) and loss.py (C) to write train.py.

On Monday morning, all three check in:
- Person A: is cnn.py final and committed? âœ… / âŒ
- Person B: is vit.py and fusion.py final? âœ… / âŒ
- Person C: can you start model.py on Wednesday? âœ… / âŒ

If files are not ready by Wednesday, Person C uses placeholder classes that return random tensors of the right shape â€” do not block on missing files.

---

## Tasks by Person

### Person A â€” Training Loop
**File:** `ml/src/train.py`

**Step by step:**
1. Set up Weights & Biases: pip install wandb, wandb login, wandb.init(project='skinfusenet')
2. Write the training loop structure BEFORE plugging in real model: fake_model, fake_loss, fake_data first
3. Real loop structure: for epoch in range(max_epochs): train one epoch â†’ compute val F1 â†’ check early stopping â†’ save checkpoint if improved
4. Optimiser: torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-2)
5. Scheduler: CosineAnnealingLR with 10 epoch warmup
6. Early stopping: if val_F1 has not improved for 15 consecutive epochs â†’ break
7. Checkpoint: torch.save({'epoch': epoch, 'model_state_dict': model.state_dict(), 'val_f1': best_f1}, 'ml/checkpoints/best_model.pt')
8. W&B logging every epoch: wandb.log({'train_loss': ..., 'val_loss': ..., 'val_f1': ..., 'lr': ...})
9. Test run: 2 epochs on 100 images only â€” confirm loss decreases, W&B updates, checkpoint saves

**Why this matters:** The training loop is the conductor. It orchestrates all components without doing the hard work itself. Getting the loop right before plugging in the real model saves hours of debugging later.

---

### Person B â€” Cross-Attention Fusion
**File:** `ml/src/fusion.py`

**Step by step:**
1. Use nn.MultiheadAttention â€” do NOT implement attention from scratch
2. Design: CNN embedding attends to ViT (first cross-attention), result attends to metadata (second cross-attention)
3. Add LayerNorm before and after each attention operation
4. Add FFN after second attention: Linear(D, D*4) â†’ GELU â†’ Dropout â†’ Linear(D*4, D)
5. Forward: (cnn_emb [B,D], vit_emb [B,D], meta_emb [B,D]) â†’ fused [B,D]
6. Note: MultiheadAttention expects [B,1,D] for single-vector inputs â€” unsqueeze and squeeze
7. Test with random tensors: 3 random [4,512] tensors â†’ should output [4,512]
8. Person C needs this file by Wednesday â€” commit it by Tuesday night

**Why this matters:** Cross-attention is smarter than simple concatenation. When the model sees an ambiguous lesion, it can attend to patient metadata (age, location) to resolve the ambiguity â€” mimicking how a real dermatologist integrates visual and clinical information. Prior work (Restrepo et al.) confirmed cross-attention consistently outperforms all simpler fusion strategies.

---

### Person C â€” Focal Loss + Full Model Assembly
**File:** `ml/src/loss.py + ml/src/model.py`

**Step by step:**
1. loss.py first: FocalLoss class with gamma=2.0, label_smoothing=0.1
2. Verify focal loss: easy example (model very confident) â†’ focal loss << crossentropy. Hard example â†’ similar. If this is not the case, formula is wrong.
3. model.py: SkinFuseNet class takes CNN branch, ViT branch, BERT branch, fusion as constructor args
4. Forward: (image [B,3,256,256], input_ids [B,128], attention_mask [B,128]) â†’ logits [B,7]
5. Add classification head: nn.Sequential(LayerNorm(D), Dropout(0.3), Linear(D,7))
6. Test on GPU: model.to('cuda'), real batch from DataLoader.to('cuda'), forward pass, check output shape [B,7]
7. Print total and trainable parameter counts
8. Confirm Person A's train.py call works: model(batch['image'], batch['input_ids'], batch['attention_mask'])

**Why this matters:** Model assembly is the most coordination-heavy task â€” it combines work from all three people. Getting the constructor arguments right means Person A's training loop can swap model configurations cleanly for the ablation study.

---

## Daily Breakdown

| Day | Focus | Who |
|-----|-------|-----|
| Mon | Chase A for cnn.py, B for vit.py. Confirm Person C can start model.py Wednesday. | All 3 coordination |
| Tue | A: W&B setup + training loop skeleton. B: fusion.py. C: loss.py focal loss. | Each independently |
| Wed | B: finish fusion.py and commit. C: start model.py using branches from A and B. | B priority: commit by tonight |
| Thu | C: finish model.py. Full forward pass test on GPU. A: plug real model into train.py. | C delivers to team |
| Fri | A: test training loop 2 epochs on 100 images. Fix any errors. | A focus |
| Sat | All 3: review model.py structure together. Verify forward call signature. | All 3 together |
| Sun | Weekly review. Can everyone explain what cross-attention fusion does? | All 3 together |

---

## Week 6 Checklist

### Person A
- [ ] Set up Weights & Biases: pip install wandb, wandb login, wandb.init(project='ski...
- [ ] Write the training loop structure BEFORE plugging in real model: fake_model, fak...
- [ ] Real loop structure: for epoch in range(max_epochs): train one epoch â†’ compute v...
- [ ] Optimiser: torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-2)
- [ ] Scheduler: CosineAnnealingLR with 10 epoch warmup

### Person B
- [ ] Use nn.MultiheadAttention â€” do NOT implement attention from scratch
- [ ] Design: CNN embedding attends to ViT (first cross-attention), result attends to ...
- [ ] Add LayerNorm before and after each attention operation
- [ ] Add FFN after second attention: Linear(D, D*4) â†’ GELU â†’ Dropout â†’ Linear(D*4, D)
- [ ] Forward: (cnn_emb [B,D], vit_emb [B,D], meta_emb [B,D]) â†’ fused [B,D]

### Person C
- [ ] loss.py first: FocalLoss class with gamma=2.0, label_smoothing=0.1
- [ ] Verify focal loss: easy example (model very confident) â†’ focal loss << crossentr...
- [ ] model.py: SkinFuseNet class takes CNN branch, ViT branch, BERT branch, fusion as...
- [ ] Forward: (image [B,3,256,256], input_ids [B,128], attention_mask [B,128]) â†’ logi...
- [ ] Add classification head: nn.Sequential(LayerNorm(D), Dropout(0.3), Linear(D,7))

### Team
- [ ] All files committed and pushed to GitHub
- [ ] team/week6_review.md written and committed
- [ ] Each person can explain their week's work to the other two

---

## Common Errors This Week

### MultiheadAttention shape error
**Fix:** MultiheadAttention with batch_first=True expects [B, sequence_length, D]. For single vectors, use .unsqueeze(1) to add sequence dimension, and .squeeze(1) on output.

### loss.backward() fails
**Fix:** Make sure model is in train() mode, not eval(). Also make sure you called optimizer.zero_grad() before loss.backward().

### W&B login fails on Windows
**Fix:** Run: wandb login in Command Prompt (not VS Code terminal). If it hangs, set WANDB_API_KEY environment variable manually.

### Checkpoint not saving
**Fix:** Check that ml/checkpoints/ folder exists. Git does not track empty folders â€” create a .gitkeep file inside it.

---

## Deliverable

Full SkinFuseNet forward pass tested on GPU. train.py skeleton running one epoch. loss.py verified against CrossEntropy.

---

*SkinFuseNet Â· Week 6 Â· All 3 team members*
