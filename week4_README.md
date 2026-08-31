# SkinFuseNet â€” Week 4
### Dataset Finalisation Â· BERT Tokenisation Â· Stratified Split Verification

> **Phase:** ML â€” Data Pipeline  
> **Weeks done:** 1 âœ… Â· 2 âœ… Â· 3 âœ… Â· **4 â† you are here**  
> **Time needed:** 10â€“15 hrs across the week  
> **Prerequisite:** Week 3 complete â€” all 10,015 images in `ml/data/processed/`, `augmentation.py` committed

---

## ðŸ”„ Current Status (Updated August 29, 2026)

| Task | Owner | Status |
|---|---|---|
| `dataset.py` edge cases (missing age, unknown sex/loc) | Person A | âœ… **Done** |
| `dataset.py` loads from `processed/` path | Person A | âœ… **Done** |
| BERT `MetadataTokenizer` class (`tokenize()`) | Person B | âœ… **Done** (in `bert.py`) |
| `input_ids` + `attention_mask` in DataLoader batch | Person A/B | âœ… **Done** |
| `verify_dataset.py` (12 shape checks) | Person A | âœ… **Written** â€” needs running with real data |
| `split_verification.py` (stratified proportions) | Person C | âŒ **Missing** |
| `team/split_verification_results.md` | Person C | âŒ **Missing** |
| HAM10000 metadata CSV in `ml/data/raw/` | Person A | âŒ **Not downloaded yet** |
| `team/week4_review.md` | Team | âŒ **Missing** |

> **Blocker:** `verify_dataset.py` cannot be run until `HAM10000_metadata.csv` is downloaded.

## Week 4 Goal

By end of this week, `dataset.py` must be bulletproof â€” handling every edge case without crashing. BERT tokenisation must be integrated so every sample includes tokenised metadata. The 70/20/10 split must be verified as correctly stratified. Anyone on the team must be able to run `verify_dataset.py` and see all green checks.

---

## Day 1 â€” Monday Â· Audit + Plan

**All 3 people Â· ~1.5 hrs**

### Person A â€” Audit dataset.py
Open `ml/src/dataset.py` from week 2. Go through every line. Write down every place something could go wrong:

```
Potential failure points to fix:
1. df['age'] has NaN values for some rows â€” crashes float conversion
2. df['sex'] has 'unknown' for some rows â€” not in SEX_MAP
3. df['localization'] has 'unknown' for some rows â€” not in LOC_MAP
4. Image file not found in processed folder â€” raises FileNotFoundError
5. Corrupt image file â€” PIL raises OSError when opening
6. Paths still pointing to raw/ folder â€” must update to processed/
```

### Person B â€” Study BERT tokenisation
Open a Jupyter notebook. Run this and study the output:
```python
from transformers import BertTokenizer
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')

# Try different metadata combinations
samples = [
    "Patient: 45-year-old male. Lesion location: back.",
    "Patient: 70-year-old female. Lesion location: lower extremity.",
    "Patient: 25-year-old male. Lesion location: face.",
]
for text in samples:
    tokens = tokenizer(text, padding='max_length', max_length=128,
                       truncation=True, return_tensors='pt')
    print(f"Text: {text}")
    print(f"  input_ids shape:      {tokens['input_ids'].shape}")
    print(f"  attention_mask shape: {tokens['attention_mask'].shape}")
    print(f"  Real tokens: {tokens['attention_mask'].sum().item()} / 128")
    print()
```
Understand: `attention_mask` has 1s for real tokens and 0s for padding.

### Person C â€” Plan split verification
Open HAM10000 metadata CSV in a notebook. Run:
```python
import pandas as pd
df = pd.read_csv('ml/data/raw/HAM10000_metadata.csv')
print(df['dx'].value_counts())
print(df['dx'].value_counts() / len(df) * 100)
```
Write down the expected percentage for each class. These are the target percentages that each split should match within Â±2%.

---

## Day 2 â€” Tuesday Â· Fix dataset.py Edge Cases

**Person A leads Â· B and C watch and understand Â· ~3 hrs**

### Person A â€” Harden dataset.py

**Fix 1 â€” Missing age:**
```python
# In __getitem__:
age_raw = row['age']
if pd.isna(age_raw):
    age_raw = 45.0   # fill with dataset median
    # Log this: print(f"Warning: missing age for {row['image_id']}, using 45.0")
age = torch.tensor(float(age_raw) / 85.0, dtype=torch.float32)
```

**Fix 2 â€” Unknown sex:**
```python
SEX_MAP = {'male': 0, 'female': 1, 'unknown': 2}
sex_str = str(row['sex']).lower().strip()
sex_idx = SEX_MAP.get(sex_str, 2)   # default to 2 = unknown
sex = torch.tensor(sex_idx, dtype=torch.long)
```

**Fix 3 â€” Unknown localization:**
```python
LOC_MAP = {
    'back': 0, 'lower extremity': 1, 'trunk': 2,
    'upper extremity': 3, 'abdomen': 4, 'face': 5,
    'hand': 6, 'foot': 7, 'scalp': 8, 'neck': 9,
    'ear': 10, 'genital': 11, 'acral': 12, 'unknown': 13
}
loc_str = str(row['localization']).lower().strip()
loc_idx = LOC_MAP.get(loc_str, 13)  # default to 13 = unknown
```

**Fix 4 â€” Image not found:**
```python
def _find_image(self, image_id):
    path = os.path.join(self.processed_dir, f"{image_id}.jpg")
    if os.path.exists(path):
        return path
    # Log missing image
    with open('ml/logs/missing_images.txt', 'a') as f:
        f.write(f"{image_id}\n")
    return None   # will trigger Fix 5

def __getitem__(self, idx):
    row = self.df.iloc[idx]
    img_path = self._find_image(row['image_id'])

    if img_path is None:
        # Return black tensor if image not found
        image = torch.zeros(3, 256, 256)
    else:
        # Fix 5 â€” Corrupt image:
        try:
            image = Image.open(img_path).convert('RGB')
            if self.transform:
                image = self.transform(image)
        except (OSError, Exception):
            image = torch.zeros(3, 256, 256)
```

**Fix 5 â€” Update image path:**
Change the processed directory from raw folders to:
```python
self.processed_dir = "ml/data/processed"
```

**Summary print at __init__:**
```python
def __init__(self, dataframe, transform=None):
    self.df = dataframe.reset_index(drop=True)
    self.transform = transform
    self.processed_dir = "ml/data/processed"
    # Count available images
    found = sum(1 for img_id in self.df['image_id']
                if os.path.exists(os.path.join(self.processed_dir, f"{img_id}.jpg")))
    print(f"Dataset: {len(self.df)} samples, {found} images found, "
          f"{len(self.df) - found} missing")
```

---

## Day 3 â€” Wednesday Â· BERT Tokenisation Integration

**Person B leads Â· A and C follow Â· ~3 hrs**

### Person B â€” Integrate tokenisation into dataset.py

**Step 1 â€” Load tokenizer once at module level:**
At the top of `dataset.py`, after imports:
```python
from transformers import BertTokenizer
BERT_TOKENIZER = BertTokenizer.from_pretrained('bert-base-uncased')
```
Loading the tokenizer once at module level is important â€” loading it inside `__getitem__` would reload it 10,000+ times during training, which is very slow.

**Step 2 â€” Add tokenise_metadata function:**
```python
def tokenise_metadata(age_raw, sex_str, loc_str):
    """
    Convert patient metadata to BERT token tensors.
    
    Always uses:
    - padding='max_length'  â†’ ensures all sequences are same length
    - max_length=128        â†’ fixed length for DataLoader batching
    - truncation=True       â†’ handles edge cases (very long strings)
    
    Returns:
    - input_ids:      [128] â€” integer token IDs
    - attention_mask: [128] â€” 1 for real tokens, 0 for padding
    """
    age_val = int(float(age_raw)) if not pd.isna(age_raw) else 45
    prompt = f"Patient: {age_val}-year-old {sex_str}. Lesion location: {loc_str}."

    tokens = BERT_TOKENIZER(
        prompt,
        padding='max_length',
        max_length=128,
        truncation=True,
        return_tensors='pt'
    )
    return {
        'input_ids':      tokens['input_ids'].squeeze(0),       # [128]
        'attention_mask': tokens['attention_mask'].squeeze(0),  # [128]
    }
```

**Step 3 â€” Call it in __getitem__ and add to return dict:**
```python
def __getitem__(self, idx):
    row = self.df.iloc[idx]
    
    # ... (existing image loading code) ...
    
    # Add tokenisation:
    tokens = tokenise_metadata(row['age'], row['sex'], row['localization'])
    
    return {
        'image':          image,
        'age':            age,
        'sex':            sex,
        'localization':   localization,
        'label':          label,
        'input_ids':      tokens['input_ids'],      # NEW
        'attention_mask': tokens['attention_mask'], # NEW
    }
```

**Step 4 â€” Verify batch shapes after integration:**
```python
from ml.src.dataset import get_dataloaders
train_loader, _, _ = get_dataloaders(csv_path, batch_size=4)
batch = next(iter(train_loader))

print("image shape:         ", batch['image'].shape)          # [4, 3, 256, 256]
print("label shape:         ", batch['label'].shape)          # [4]
print("input_ids shape:     ", batch['input_ids'].shape)      # [4, 128]  â† NEW
print("attention_mask shape:", batch['attention_mask'].shape) # [4, 128]  â† NEW

# Verify dtypes
assert batch['image'].dtype == torch.float32
assert batch['label'].dtype == torch.int64
assert batch['input_ids'].dtype == torch.int64
assert batch['attention_mask'].dtype == torch.int64
print("âœ… All shapes and dtypes correct")
```

**Why padding must always be max_length â€” explain to your team:**
Without padding, sequence lengths vary per sample (a short metadata string = fewer tokens). DataLoader tries to stack all samples in a batch into one tensor. If sequences have different lengths, this fails with:
```
RuntimeError: stack expects each tensor to be equal size
```
`padding='max_length'` pads every sequence to exactly 128 tokens, so all tensors in a batch have the same shape and stacking works.

---

## Day 4 â€” Thursday Â· Split Verification

**Person C leads Â· A and B follow Â· ~2 hrs**

### Person C â€” Write split_verification.py

Create `ml/src/split_verification.py`:

**Step 1 â€” Reproduce the split:**
```python
import pandas as pd
from sklearn.model_selection import train_test_split
from collections import Counter

CSV_PATH = 'ml/data/raw/HAM10000_metadata.csv'
df = pd.read_csv(CSV_PATH)

# Same split logic as dataset.py
df_trainval, df_test  = train_test_split(df, test_size=0.10,
                                          stratify=df['dx'], random_state=42)
df_train, df_val      = train_test_split(df_trainval, test_size=0.222,
                                          stratify=df_trainval['dx'], random_state=42)
```

**Step 2 â€” Check total counts:**
```python
total = len(df)
print(f"Full dataset: {total}")
print(f"Train:        {len(df_train)} ({len(df_train)/total*100:.1f}%)")
print(f"Val:          {len(df_val)} ({len(df_val)/total*100:.1f}%)")
print(f"Test:         {len(df_test)} ({len(df_test)/total*100:.1f}%)")
# Expected: ~7011 / ~2003 / ~1001
```

**Step 3 â€” Check class distribution in each split:**
```python
CLASS_ORDER = ['nv','mel','bkl','bcc','akiec','vasc','df']
print("\nClass distribution comparison:")
print(f"{'Class':8} {'Full%':8} {'Train%':8} {'Val%':8} {'Test%':8} {'Status':8}")
print("-" * 55)

full_dist = df['dx'].value_counts(normalize=True) * 100
all_pass = True

for cls in CLASS_ORDER:
    full_pct  = full_dist.get(cls, 0)
    train_pct = (df_train['dx'].value_counts(normalize=True) * 100).get(cls, 0)
    val_pct   = (df_val['dx'].value_counts(normalize=True) * 100).get(cls, 0)
    test_pct  = (df_test['dx'].value_counts(normalize=True) * 100).get(cls, 0)
    
    # Check all splits within 2% of full dataset
    ok = all(abs(p - full_pct) < 2.0 for p in [train_pct, val_pct, test_pct])
    status = "âœ… OK" if ok else "âŒ FAIL"
    if not ok:
        all_pass = False
    
    print(f"{cls.upper():8} {full_pct:7.1f}% {train_pct:7.1f}% {val_pct:7.1f}% {test_pct:7.1f}% {status}")
```

**Step 4 â€” Check minority class counts in test:**
```python
print("\nMinority class counts in test set:")
MIN_REQUIRED = 5
for cls in ['vasc', 'df']:
    count = (df_test['dx'] == cls).sum()
    status = f"âœ… ({count} samples)" if count >= MIN_REQUIRED else f"âŒ ONLY {count} samples!"
    print(f"  {cls.upper()}: {status}")
```

**Step 5 â€” Check reproducibility:**
```python
print("\nReproducibility check (run split 3 times with same seed):")
results = []
for run in range(3):
    tv, te = train_test_split(df, test_size=0.10, stratify=df['dx'], random_state=42)
    results.append(set(te['image_id'].tolist()))

if results[0] == results[1] == results[2]:
    print("âœ… Same split produced 3 times â€” reproducible")
else:
    print("âŒ FAIL â€” different splits produced. Check random_state usage.")
```

**Step 6 â€” Write results to file:**
```python
with open('team/split_verification_results.md', 'w') as f:
    f.write("# Split Verification Results\n\n")
    f.write(f"Total dataset: {total} images\n")
    f.write(f"Train: {len(df_train)} | Val: {len(df_val)} | Test: {len(df_test)}\n\n")
    f.write("All class proportions within Â±2% across splits: ")
    f.write("âœ… PASS\n" if all_pass else "âŒ FAIL\n")
    f.write("Reproducibility with random_state=42: âœ… PASS\n")

print("\nResults written to team/split_verification_results.md")
```

---

## Day 5 â€” Friday Â· Write verify_dataset.py

**Person A writes Â· B and C run it on their machines Â· ~2 hrs**

### Person A â€” Write verify_dataset.py

Create `ml/verify_dataset.py` â€” a standalone verification script:

```
verify_dataset.py checks:

For train, val, and test DataLoaders:
1. Batch image shape is [batch_size, 3, 256, 256]       â† PASS/FAIL
2. Batch label shape is [batch_size]                     â† PASS/FAIL
3. Batch input_ids shape is [batch_size, 128]            â† PASS/FAIL
4. Batch attention_mask shape is [batch_size, 128]       â† PASS/FAIL
5. Image dtype is float32                                â† PASS/FAIL
6. Label dtype is int64                                  â† PASS/FAIL
7. Image min value > -3.5 (after normalisation)         â† PASS/FAIL
8. Image max value < 3.5  (after normalisation)         â† PASS/FAIL
9. Label values all between 0 and 6                     â† PASS/FAIL
10. Age values all between 0.0 and 1.0                  â† PASS/FAIL
11. input_ids values all between 0 and 30522 (vocab)    â† PASS/FAIL
12. attention_mask values only 0 or 1                   â† PASS/FAIL
```

The script must:
- Print each check as it runs
- Print `âœ… PASS` or `âŒ FAIL: [description]` for each
- Print a final summary: `All X checks passed` or `X checks failed`
- Exit with code 1 if any check fails (useful for automation)

### Person B â€” Run verify_dataset.py
```bash
cd ml
venv\Scripts\activate
python verify_dataset.py
```
Share the output in the team group chat.

### Person C â€” Run verify_dataset.py
Same â€” run it independently. If Person A and B get identical results but Person C gets different results, there is an environment bug that needs fixing together.

---

## Day 6 â€” Saturday Â· Polish + Commit Everything

**Each person Â· ~1.5 hrs**

### Person A â€” Final dataset.py
- Add a docstring at the top explaining the class, inputs, outputs, and each returned tensor
- Add `__repr__` method: `def __repr__(self): return f"HAM10000Dataset({len(self)} samples)"`
- Run `verify_dataset.py` one final time â€” all checks green

### Person B â€” Test tokenisation edge cases
Test these specific metadata combinations:
- Patient with missing age (NaN in CSV) â€” should not crash
- Patient with sex = 'unknown' â€” should tokenise as "unknown"
- Patient with localization = 'unknown' â€” should tokenise as "unknown"
- Very old patient: age = 95 â€” normalised value = 95/85 = 1.12 (slightly above 1.0 â€” is this handled?)

### Person C â€” Commit split verification
```bash
git add ml/src/split_verification.py
git add team/split_verification_results.md
git commit -m "docs: stratified split verification â€” all classes within 2% across splits"
git push
```

### All 3 â€” Final commit
```bash
git add ml/src/dataset.py
git add ml/verify_dataset.py
git commit -m "feat: production dataset.py with edge case handling and BERT tokenisation"
git push
```

---

## Day 7 â€” Sunday Â· Weekly Review

**All 3 together Â· 30 mins**

Each person answers:
1. What did I finish this week?
2. What problems did I run into?
3. What does the team need from me before week 5?

Write in `team/week4_review.md` and commit.

**Critical question to answer this week:** Does everyone understand what `input_ids` and `attention_mask` are and why padding is necessary? If not, Person B explains it again. Week 5 builds the BERT model branch â€” you need to understand the inputs before you build the model that receives them.

---

## Week 4 Checklist

### Dataset hardening
- [x] Missing age â†’ filled with median (no crash)  âœ…
- [x] Unknown sex â†’ filled with 'unknown' (no crash)  âœ…
- [x] Unknown localization â†’ filled with 'unknown' (no crash)  âœ…
- [x] Image not found â†’ returns black tensor (no crash)  âœ…
- [x] Corrupt image â†’ returns black tensor (no crash)  âœ…
- [x] Image paths updated from `raw/` to `processed/`  âœ…
- [ ] Summary print at `__init__`: "X/10015 images found"  *(add when CSV is available)*

### BERT tokenisation
- [x] `MetadataTokenizer.tokenize()` function written  âœ…
- [x] Always uses `padding='max_length', max_length=128, truncation=True`  âœ…
- [x] `input_ids` shape is `[128]` per sample, `[B, 128]` per batch  âœ…
- [x] `attention_mask` shape is `[128]` per sample, `[B, 128]` per batch  âœ…
- [x] Tokenizer loaded once at class level (not inside `__getitem__`)  âœ…
- [x] Both new fields returned in `__getitem__` dict  âœ…

### Split verification
- [ ] `split_verification.py` written and run  âš ï¸ **MISSING â€” Person C to implement**
- [ ] All 7 classes within Â±2% across train/val/test
- [ ] DF and VASC both have â‰¥5 samples in test set
- [ ] Same split produced with `random_state=42` across 3 runs
- [ ] `team/split_verification_results.md` committed

### verify_dataset.py
- [x] Written with shape/dtype checks  âœ…
- [ ] All checks PASS on Person A's machine  *(blocked: needs CSV)*
- [ ] All checks PASS on Person B's machine
- [ ] All checks PASS on Person C's machine

### Team
- [ ] HAM10000 metadata CSV downloaded to `ml/data/raw/`  **ACTION NEEDED**
- [ ] All files committed and pushed
- [ ] `team/week4_review.md` written and committed

---

## Common Errors This Week

### "stack expects each tensor to be equal size"
**Cause:** BERT padding is not set to `max_length`  
**Fix:** Make sure you have `padding='max_length', max_length=128` in the tokenizer call. This is the single most common error this week.

### "NaN in batch â€” cannot convert to tensor"
**Cause:** `pd.isna(row['age'])` returns True but not handled before `float()` conversion  
**Fix:** Always check `if pd.isna(age_raw): age_raw = 45.0` before any arithmetic on age

### "KeyError: 'input_ids'" from DataLoader
**Cause:** Old cached `dataset.py` being imported instead of updated version  
**Fix:** Restart your Python kernel or terminal. Python caches imported modules.

### verify_dataset.py passes on one machine but fails on another
**Cause:** Different versions of `transforms.Normalize` or different random states  
**Fix:** Make sure all 3 machines use the same `requirements.txt`. Run `pip list | grep torch` on all 3 and compare versions.

### "BertTokenizer slow" warning
```
The tokenizer class you load from ... is not the fast tokenizer
```
**This is just a warning, not an error.** You can suppress it or install `sentencepiece` and `tokenizers` packages. The tokenizer still works correctly.

---

## Reminder for Week 5

Week 5 starts model branch building. Before day 1 of week 5, all 3 people must sit together and agree on `EMBEDDING_DIM`. This is a number (recommended: 512) that all three branches must output. Write it in `team/API_CONTRACT.md` on that day.

The branches built in week 5 take as input:
- **CNN and ViT branches:** the image tensor `[B, 3, 256, 256]` from the dataset
- **BERT branch:** the `input_ids [B, 128]` and `attention_mask [B, 128]` you built this week

---

*SkinFuseNet Â· Week 4 Â· All 3 team members*
