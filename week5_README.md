# SkinFuseNet — Week 5
### Model Branches · EfficientNetV2 · Swin Transformer V2 · BERT Encoder

> **Phase:** ML — Model Building  
> **Weeks done:** 1 ✅ · 2 ✅ · 3 ✅ · 4 ✅ · **5 ← you are here**  
> **Time needed:** 10–15 hrs across the week  
> **Prerequisite:** Week 4 complete — dataset.py with BERT tokenisation verified

---

## Week 5 Goal

All three model branches independently tested and producing correct output shapes. Embedding dimension agreed and locked in team/API_CONTRACT.md before any code is written.

---

## Before Day 1

⚠️ ALL THREE AGREE ON EMBEDDING_DIM BEFORE WRITING CODE

This is the single most important coordination point of the whole project. All three branches must output the same size vector or cross-attention fusion cannot work.

Sit together and write this in team/API_CONTRACT.md:
- Agreed EMBEDDING_DIM: 512 (recommended)
- All branches output shape: [B, 512]
- Date agreed: [today]
- Agreed by: Person A, Person B, Person C

Do not write a single line of branch code before this is agreed.

---

## Tasks by Person

### Person A — EfficientNetV2 CNN Branch
**File:** `ml/src/branches/cnn.py`

**Step by step:**
1. Load efficientnetv2_s from timm with pretrained=True. This downloads ~80MB of ImageNet weights.
2. Print model layers: for name, m in model.named_modules(): print(name). Find the classifier head.
3. Replace classifier: model.classifier = nn.Linear(model.classifier.in_features, EMBEDDING_DIM)
4. Freeze all layers except last 2 blocks + projection: for name, p in model.named_parameters(): p.requires_grad = 'blocks.6' in name or 'blocks.7' in name or 'classifier' in name
5. Forward method: takes image [B,3,256,256] returns embedding [B,EMBEDDING_DIM]
6. Test block under if __name__ == '__main__': create random batch, pass through, print shape, assert shape == (4, 512)
7. Print trainable vs frozen parameter count

**Why this matters:** EfficientNetV2 excels at local texture, border irregularities, and colour patterns. CNNs have been the dominant approach for dermoscopic classification since 2017. Pretrained ImageNet weights already know edges, textures, and shapes — we fine-tune the last two blocks to learn lesion-specific patterns.

---

### Person B — Swin Transformer V2 Branch
**File:** `ml/src/branches/vit.py`

**Step by step:**
1. Load swin_v2_s from timm with pretrained=True.
2. Print model.head to see the classification head structure
3. Replace head: model.head = nn.Linear(model.head.in_features, EMBEDDING_DIM)
4. Forward method: takes image [B,3,256,256] returns embedding [B,EMBEDDING_DIM]
5. Test block: same as cnn.py — random batch, check output shape
6. Cross-verify: run BOTH cnn.py and vit.py on the same batch. Print and compare shapes. They must be identical.
7. Assert: cnn_out.shape == vit_out.shape — if not, one of the EMBEDDING_DIM values is wrong

**Why this matters:** Swin Transformer V2 uses shifted-window self-attention that builds global context across the full lesion. It can link a suspicious border region to the colour pattern in the lesion centre — a long-range relationship CNNs cannot directly model. This is why adding Swin gives the single largest accuracy jump in the ablation study (+5.9%).

---

### Person C — BERT Metadata Encoder Branch
**File:** `ml/src/branches/bert.py`

**Step by step:**
1. Load BertModel.from_pretrained('bert-base-uncased') — this is different from BertTokenizer. BertModel is the actual neural network.
2. Freeze ALL parameters: for param in self.bert.parameters(): param.requires_grad = False
3. Note: training loop will unfreeze layer by layer after epoch 5 — the branch class itself stays frozen at init
4. Add projection: self.projection = nn.Linear(768, EMBEDDING_DIM). 768 is BERT's hidden size.
5. Forward: takes input_ids [B,128] and attention_mask [B,128], runs through BERT, takes CLS token at position 0 (outputs.last_hidden_state[:,0,:]), projects to EMBEDDING_DIM
6. Test with real tokenised data from dataset: load a batch, pass input_ids and attention_mask through bert.py
7. Verify output shape is [B, EMBEDDING_DIM]

**Why this matters:** BERT produces contextualised embeddings that capture the clinical meaning of the patient description. A 70-year-old woman with a lesion on her lower extremity has a very different melanoma risk profile than a 25-year-old man with the same visual lesion. BERT's language understanding captures these demographic risk patterns that no image model can see.

---

## Daily Breakdown

| Day | Focus | Who |
|-----|-------|-----|
| Mon | Agree EMBEDDING_DIM in team/API_CONTRACT.md. Print and explore branch architectures. | All 3 together |
| Tue | Write branch classes with pseudocode comments first, then fill in real code. | Each person independently |
| Wed | Write and run test blocks — verify output shapes. | Each person independently |
| Thu | Cross-verify: Person A and B run both cnn.py and vit.py on same batch. | A + B together · C tests with tokenised data |
| Fri | Fix any shape mismatches. Document freezing strategy in comments. | Each person independently |
| Sat | Commit all branches. Run all 3 test blocks together on one machine. | All 3 together |
| Sun | Weekly review. Answer: does everyone understand what each branch does? | All 3 together |

---

## Week 5 Checklist

### Person A
- [ ] Load efficientnetv2_s from timm with pretrained=True. This downloads ~80MB of Im...
- [ ] Print model layers: for name, m in model.named_modules(): print(name). Find the ...
- [ ] Replace classifier: model.classifier = nn.Linear(model.classifier.in_features, E...
- [ ] Freeze all layers except last 2 blocks + projection: for name, p in model.named_...
- [ ] Forward method: takes image [B,3,256,256] returns embedding [B,EMBEDDING_DIM]

### Person B
- [ ] Load swin_v2_s from timm with pretrained=True.
- [ ] Print model.head to see the classification head structure
- [ ] Replace head: model.head = nn.Linear(model.head.in_features, EMBEDDING_DIM)
- [ ] Forward method: takes image [B,3,256,256] returns embedding [B,EMBEDDING_DIM]
- [ ] Test block: same as cnn.py — random batch, check output shape

### Person C
- [ ] Load BertModel.from_pretrained('bert-base-uncased') — this is different from Ber...
- [ ] Freeze ALL parameters: for param in self.bert.parameters(): param.requires_grad ...
- [ ] Note: training loop will unfreeze layer by layer after epoch 5 — the branch clas...
- [ ] Add projection: self.projection = nn.Linear(768, EMBEDDING_DIM). 768 is BERT's h...
- [ ] Forward: takes input_ids [B,128] and attention_mask [B,128], runs through BERT, ...

### Team
- [ ] All files committed and pushed to GitHub
- [ ] team/week5_review.md written and committed
- [ ] Each person can explain their week's work to the other two

---

## Common Errors This Week

### 'module' object has no attribute 'head'
**Fix:** The head layer in Swin V2 might be named differently. Run: print(model) to see the full architecture. Look for the final Linear layer and use its actual attribute name.

### in_features mismatch
**Fix:** Different timm versions use different internal dimensions. Always get in_features from the actual model: model.classifier.in_features (not hardcoding a number).

### BertModel vs BertForSequenceClassification
**Fix:** Use BertModel (base model) not BertForSequenceClassification (adds a classification head you do not want). outputs.last_hidden_state exists on BertModel, not on all BERT variants.

### RuntimeError: Expected all tensors on same device
**Fix:** During testing, make sure the branch model and input tensors are both on CPU or both on GPU. Add .to(device) to both.

---

## Deliverable

cnn.py, vit.py, bert.py — each producing [B, 512] output. team/API_CONTRACT.md updated. Cross-verification between cnn.py and vit.py passing.

---

*SkinFuseNet · Week 5 · All 3 team members*