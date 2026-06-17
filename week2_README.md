# SkinFuseNet — Week 2 Guide
### PyTorch Deep Dive, Dataset Class, SAM Preprocessing, Mock API & React Components

> **Who this is for:** All 3 team members · Windows machines · VS Code  
> **Time required:** 10–15 hrs across the week  
> **Prerequisite:** Week 1 fully complete — all 30 checklist items ticked  
> **Goal by end of week:** DataLoader returning correct batches, SAM running on one image, mock `/predict` endpoint live, ImageUpload + MetadataForm built in React, frontend calling mock backend successfully

---

## 📋 Table of Contents

- [Week 2 Overview](#week-2-overview)
- [Day 1 — PyTorch Deep Dive: Fix the ML Confusion](#day-1--pytorch-deep-dive-fix-the-ml-confusion)
- [Day 2 — Write the Dataset Class](#day-2--write-the-dataset-class)
- [Day 3 — Class Imbalance & Focal Loss Intuition](#day-3--class-imbalance--focal-loss-intuition)
- [Day 4 — SAM Preprocessing: First Attempt](#day-4--sam-preprocessing-first-attempt)
- [Day 5 — Backend: Mock /predict Endpoint](#day-5--backend-mock-predict-endpoint)
- [Day 6 — Frontend: ImageUpload + MetadataForm](#day-6--frontend-imageupload--metadataform)
- [Day 7 — Connect Frontend to Mock Backend + Weekly Review](#day-7--connect-frontend-to-mock-backend--weekly-review)
- [Week 2 Checklist](#week-2-checklist)
- [Common Errors & Fixes](#common-errors--fixes)
- [Resources](#resources)

---

## Week 2 Overview

### What changes this week

Week 1 was all setup and exploration. Week 2 is where you write your first real project code. Three things happen in parallel:

- **ML track** — you stop experimenting in notebooks and write production-quality Python files: `dataset.py` that correctly loads images + metadata into PyTorch batches
- **Backend track** — you build a real FastAPI endpoint that matches the API contract exactly, returning fake but correctly shaped JSON so the frontend can be built against it
- **Frontend track** — you build the two input components (image upload and metadata form) that collect everything needed before the API call

### Rotation this week

| Day | Who leads | Others do |
|-----|-----------|-----------|
| Day 1–3 | All 3 together | Same tasks |
| Day 4 | Sameer leads SAM | Ridam and Sana follow then replicate |
| Day 5 | Ridam leads Backend | Sameer and Sana follow then replicate |
| Day 6 | Sana leads Frontend | Sameer and Ridam follow then replicate |
| Day 7 | All 3 together | Connect + review |

### The most important rule this week

Ridam and Sana do NOT wait for the ML model to be trained before building their parts. The mock endpoint returns fake data with the correct JSON shape — the entire frontend can be built and tested against it. When the real model is ready in week 7, it just replaces the fake response. No frontend or backend code changes.

---

## Day 1 — PyTorch Deep Dive: Fix the ML Confusion

**All 3 people · ~2.5 hrs · open Jupyter notebook**

Since ML felt hardest in week 1, this day goes slower and deeper before writing any model code. Do not rush through this — understanding tensors and training loops properly now saves hours of debugging later.

---

### Activate your ML environment first

Open VS Code terminal:
```
cd ml
venv\Scripts\activate
jupyter notebook
```

Create `notebooks\week2_pytorch_deepdive.ipynb`

---

### Part 1 — Tensors properly (45 mins)

**Cell 1 — Shapes are everything:**
```python
import torch

# A tensor is just a multi-dimensional array
# The shape tells you exactly what it contains

scalar   = torch.tensor(3.14)                    # shape: []        = one number
vector   = torch.tensor([1.0, 2.0, 3.0])         # shape: [3]       = 3 numbers
matrix   = torch.zeros(4, 5)                     # shape: [4, 5]    = 4 rows, 5 cols
image    = torch.zeros(3, 256, 256)              # shape: [3,256,256] = one RGB image
batch    = torch.zeros(32, 3, 256, 256)          # shape: [32,3,256,256] = 32 images

# Always verify shape before doing anything else
print("scalar:", scalar.shape)     # torch.Size([])
print("vector:", vector.shape)     # torch.Size([3])
print("matrix:", matrix.shape)     # torch.Size([4, 5])
print("image:", image.shape)       # torch.Size([3, 256, 256])
print("batch:", batch.shape)       # torch.Size([32, 3, 256, 256])
```

**Cell 2 — dtype and device matter:**
```python
# dtype = what kind of numbers are stored
float_tensor = torch.tensor([1.0, 2.0])       # float32 by default
int_tensor   = torch.tensor([1, 2])            # int64 by default
print("float dtype:", float_tensor.dtype)      # torch.float32
print("int dtype:", int_tensor.dtype)          # torch.int64

# Models expect float32 images
# Labels must be int64 (called LongTensor)
image  = torch.randn(3, 256, 256)             # float32 — correct for image
label  = torch.tensor(3)                      # int64 — correct for class index
print("image dtype:", image.dtype)
print("label dtype:", label.dtype)

# device = where is this tensor stored (CPU or GPU)
print("device:", image.device)    # cpu
if torch.cuda.is_available():
    image_gpu = image.cuda()
    print("GPU device:", image_gpu.device)    # cuda:0
```

**Cell 3 — Common shape mistakes and how to fix them:**
```python
# Mistake 1 — model expects batch but you give single image
model_input  = torch.randn(3, 256, 256)        # WRONG — no batch dimension
model_input  = torch.randn(1, 3, 256, 256)     # CORRECT — batch of 1
model_input  = model_input.unsqueeze(0)        # OR: add batch dim with unsqueeze

# Mistake 2 — channels last vs channels first
# PIL Image: (width, height, channels) = (256, 256, 3)
# PyTorch:   (channels, height, width) = (3, 256, 256)
# torchvision ToTensor() handles this conversion automatically

# Mistake 3 — not normalising pixel values
raw    = torch.randint(0, 255, (3, 256, 256)).float()   # values 0-255
norm   = raw / 255.0                                     # values 0-1
# torchvision ToTensor() also does this automatically

print("Always use torchvision.transforms.ToTensor() — it fixes both issues")
```

---

### Part 2 — What training actually does (45 mins)

**Cell 4 — A complete minimal training loop:**
```python
import torch
import torch.nn as nn

# ----- Fake data to simulate the problem -----
# Imagine we have 100 "images" (just random vectors here)
# and 100 labels (0 to 6 = 7 classes like our lesion types)
X = torch.randn(100, 10)            # 100 samples, 10 features each
y = torch.randint(0, 7, (100,))     # 100 labels, values 0-6

# ----- Simple model (just for understanding) -----
model = nn.Sequential(
    nn.Linear(10, 64),
    nn.ReLU(),
    nn.Linear(64, 7)                 # 7 outputs = 7 classes
)

# ----- Loss function -----
criterion = nn.CrossEntropyLoss()    # we will replace this with focal loss later

# ----- Optimizer -----
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)

# ----- Training loop -----
for epoch in range(10):
    # Step 1: Forward pass — model makes predictions
    predictions = model(X)           # shape: [100, 7]
    
    # Step 2: Compute loss — how wrong were the predictions?
    loss = criterion(predictions, y)
    
    # Step 3: Zero gradients from previous step
    optimizer.zero_grad()
    
    # Step 4: Backward pass — compute gradients
    loss.backward()
    
    # Step 5: Update weights
    optimizer.step()
    
    print(f"Epoch {epoch+1:2d} | Loss: {loss.item():.4f}")

# Loss should decrease across epochs
```

**Cell 5 — What each step actually means:**
```python
# Let's look at ONE step in slow motion

model2 = nn.Linear(3, 2)         # simplest possible model: 3 inputs, 2 outputs
x = torch.tensor([[1.0, 2.0, 3.0]])    # one sample

print("--- BEFORE training step ---")
print("Weights:", model2.weight.data)
print("Bias:", model2.bias.data)

# Forward pass
out = model2(x)
print("\nPrediction:", out)

# Fake label — let's say class 1 is correct
label = torch.tensor([1])
loss = nn.CrossEntropyLoss()(out, label)
print("Loss:", loss.item())

# Backward pass
loss.backward()
print("\nGradients (how much each weight contributed to the error):")
print(model2.weight.grad)

# Optimizer step — nudge weights to reduce loss
optimizer2 = torch.optim.SGD(model2.parameters(), lr=0.1)
optimizer2.step()

print("\n--- AFTER training step ---")
print("Weights:", model2.weight.data)
print("(Notice the weights changed slightly)")
```

---

### Part 3 — Transfer learning intuition (30 mins)

**Cell 6 — Why we use pretrained models:**
```python
import timm

# EfficientNetV2 was trained on ImageNet (1.2 million images, 1000 classes)
# It already knows: edges, textures, shapes, colours
# We just need to teach it the difference between 7 skin lesion types

# Load pretrained — this downloads ~80MB of weights
model = timm.create_model('efficientnetv2_s', pretrained=True)

# Count parameters
total_params = sum(p.numel() for p in model.parameters())
print(f"Total parameters: {total_params:,}")    # ~20 million

# The last layer classifies into 1000 ImageNet classes
# We need to change it to 7 classes
print("\nOriginal final layer:", model.classifier)

# Replace with 7-class classifier
import torch.nn as nn
model.classifier = nn.Linear(model.classifier.in_features, 7)
print("New final layer:", model.classifier)

# Verify output shape
x = torch.randn(1, 3, 256, 256)
with torch.no_grad():
    out = model(x)
print("\nOutput shape:", out.shape)    # torch.Size([1, 7])
print("Now outputs 7 class scores instead of 1000")
```

---

## Day 2 — Write the Dataset Class

**All 3 people · ~3 hrs · write actual project code**

This is your first real production file. Everyone writes it together in the same session — one person types, others review and suggest.

---

### What a Dataset class needs to do

PyTorch's DataLoader works with any class that has exactly 3 methods:
- `__init__` — runs once, loads the CSV, stores image paths
- `__len__` — returns how many samples exist
- `__getitem__` — given an index, returns one sample (image + metadata + label)

The DataLoader calls `__getitem__` repeatedly, collects results into a batch, and gives it to the training loop.

---

### Step 1 — Understand the CSV structure first

Open a notebook cell and explore:
```python
import pandas as pd
import os

df = pd.read_csv(r"data\raw\HAM10000_metadata.csv")

print("Columns:", df.columns.tolist())
# ['lesion_id', 'image_id', 'dx', 'dx_type', 'age', 'sex', 'localization']

print("\nSample row:")
print(df.iloc[0])

print("\nUnique classes (dx):", df['dx'].unique())
# ['nv', 'mel', 'bkl', 'bcc', 'akiec', 'vasc', 'df']

print("\nUnique sex values:", df['sex'].unique())
# ['male', 'female', 'unknown']

print("\nUnique localizations:", df['localization'].unique())
# 13 values

print("\nAny missing ages?", df['age'].isna().sum())
# Some rows have missing age — we need to handle this
```

---

### Step 2 — Plan the encoding

Before writing code, agree on how to convert text values to numbers:

```python
# Class labels (dx) → integer 0 to 6
CLASS_MAP = {
    'nv':    0,    # Melanocytic Nevi      (6705 images)
    'mel':   1,    # Melanoma              (1113 images)
    'bkl':   2,    # Benign Keratosis      (1099 images)
    'bcc':   3,    # Basal Cell Carcinoma  (514 images)
    'akiec': 4,    # Actinic Keratosis     (327 images)
    'vasc':  5,    # Vascular Lesions      (142 images)
    'df':    6,    # Dermatofibroma        (115 images)
}

# Sex → integer
SEX_MAP = {
    'male':    0,
    'female':  1,
    'unknown': 2,
}

# Localization → integer (0 to 13)
LOC_MAP = {
    'back':            0,
    'lower extremity': 1,
    'trunk':           2,
    'upper extremity': 3,
    'abdomen':         4,
    'face':            5,
    'hand':            6,
    'foot':            7,
    'scalp':           8,
    'neck':            9,
    'ear':             10,
    'genital':         11,
    'acral':           12,
    'unknown':         13,
}
```

---

### Step 3 — Write dataset.py

Open `ml\src\dataset.py` in VS Code and write this from scratch:

```python
"""
dataset.py
HAM10000 Dataset class for SkinFuseNet.
Returns image tensor + metadata (age, sex, localization) + class label.
"""

import os
import pandas as pd
from PIL import Image
import torch
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as T
from sklearn.model_selection import train_test_split


# ─── Label mappings ───────────────────────────────────────────────────────────

CLASS_MAP = {
    'nv': 0, 'mel': 1, 'bkl': 2, 'bcc': 3,
    'akiec': 4, 'vasc': 5, 'df': 6
}

SEX_MAP = {
    'male': 0, 'female': 1, 'unknown': 2
}

LOC_MAP = {
    'back': 0, 'lower extremity': 1, 'trunk': 2,
    'upper extremity': 3, 'abdomen': 4, 'face': 5,
    'hand': 6, 'foot': 7, 'scalp': 8, 'neck': 9,
    'ear': 10, 'genital': 11, 'acral': 12, 'unknown': 13
}

# Reverse map — useful for displaying predictions
IDX_TO_CLASS = {v: k.upper() for k, v in CLASS_MAP.items()}


# ─── Image transforms ─────────────────────────────────────────────────────────

def get_train_transforms():
    """Transforms for training data — includes augmentation."""
    return T.Compose([
        T.Resize((256, 256)),
        T.RandomHorizontalFlip(p=0.5),
        T.RandomVerticalFlip(p=0.5),
        T.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]),  # ImageNet stats
    ])

def get_val_transforms():
    """Transforms for validation and test data — no augmentation."""
    return T.Compose([
        T.Resize((256, 256)),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]),
    ])


# ─── Dataset class ────────────────────────────────────────────────────────────

class HAM10000Dataset(Dataset):
    """
    PyTorch Dataset for HAM10000 skin lesion classification.

    Each sample returns:
        image       : FloatTensor [3, 256, 256]
        age         : FloatTensor scalar (normalised 0-1)
        sex         : LongTensor scalar (0=male, 1=female, 2=unknown)
        localization: LongTensor scalar (0-13)
        label       : LongTensor scalar (0-6 = class index)
    """

    def __init__(self, dataframe, image_dirs, transform=None):
        """
        Args:
            dataframe  : pandas DataFrame — rows for this split (train/val/test)
            image_dirs : list of folder paths containing the .jpg images
            transform  : torchvision transforms to apply
        """
        self.df = dataframe.reset_index(drop=True)
        self.image_dirs = image_dirs
        self.transform = transform

    def __len__(self):
        """Returns total number of samples in this split."""
        return len(self.df)

    def _find_image(self, image_id):
        """Search both image folders for a given image_id."""
        for folder in self.image_dirs:
            path = os.path.join(folder, f"{image_id}.jpg")
            if os.path.exists(path):
                return path
        raise FileNotFoundError(f"Image not found: {image_id}")

    def __getitem__(self, idx):
        """
        Returns one sample given an index.
        Called by DataLoader repeatedly to build batches.
        """
        row = self.df.iloc[idx]

        # ── Image ──────────────────────────────────────────────────────────────
        img_path = self._find_image(row['image_id'])
        image = Image.open(img_path).convert('RGB')
        if self.transform:
            image = self.transform(image)    # → FloatTensor [3, 256, 256]

        # ── Age ────────────────────────────────────────────────────────────────
        # Normalise to 0-1 range. Fill missing with median (45.0)
        age_raw = row['age'] if not pd.isna(row['age']) else 45.0
        age = torch.tensor(age_raw / 85.0, dtype=torch.float32)  # 85 = approx max

        # ── Sex ────────────────────────────────────────────────────────────────
        sex_str = str(row['sex']).lower().strip()
        sex = torch.tensor(SEX_MAP.get(sex_str, 2), dtype=torch.long)

        # ── Localization ───────────────────────────────────────────────────────
        loc_str = str(row['localization']).lower().strip()
        localization = torch.tensor(LOC_MAP.get(loc_str, 13), dtype=torch.long)

        # ── Label ──────────────────────────────────────────────────────────────
        label = torch.tensor(CLASS_MAP[row['dx']], dtype=torch.long)

        return {
            'image':        image,
            'age':          age,
            'sex':          sex,
            'localization': localization,
            'label':        label,
        }


# ─── Data loading function ────────────────────────────────────────────────────

def get_dataloaders(
    csv_path,
    image_dirs,
    batch_size=32,
    num_workers=0,        # set to 0 on Windows to avoid multiprocessing issues
    random_state=42
):
    """
    Loads HAM10000 CSV, splits into train/val/test (70/20/10),
    returns three DataLoaders.

    Args:
        csv_path    : path to HAM10000_metadata.csv
        image_dirs  : list of image folder paths
        batch_size  : images per batch
        num_workers : parallel loading workers (0 = main thread, safe on Windows)
        random_state: seed for reproducibility

    Returns:
        train_loader, val_loader, test_loader
    """
    df = pd.read_csv(csv_path)
    print(f"Total images in CSV: {len(df)}")

    # Stratified split — preserves class ratios in every split
    # First split: 90% train+val, 10% test
    df_trainval, df_test = train_test_split(
        df, test_size=0.10, stratify=df['dx'], random_state=random_state
    )
    # Second split: 70% train, 20% val (= 77.7% of trainval)
    df_train, df_val = train_test_split(
        df_trainval, test_size=0.222, stratify=df_trainval['dx'], random_state=random_state
    )

    print(f"Train: {len(df_train)} | Val: {len(df_val)} | Test: {len(df_test)}")

    # Create Dataset objects
    train_dataset = HAM10000Dataset(df_train, image_dirs, get_train_transforms())
    val_dataset   = HAM10000Dataset(df_val,   image_dirs, get_val_transforms())
    test_dataset  = HAM10000Dataset(df_test,  image_dirs, get_val_transforms())

    # Create DataLoaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,              # shuffle training data every epoch
        num_workers=num_workers,
        pin_memory=True,           # faster GPU transfer
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )

    return train_loader, val_loader, test_loader


# ─── Quick verification ───────────────────────────────────────────────────────

if __name__ == "__main__":
    CSV_PATH   = r"data\raw\HAM10000_metadata.csv"
    IMAGE_DIRS = [
        r"data\raw\HAM10000_images_part_1",
        r"data\raw\HAM10000_images_part_2",
    ]

    train_loader, val_loader, test_loader = get_dataloaders(
        csv_path=CSV_PATH,
        image_dirs=IMAGE_DIRS,
        batch_size=4,
    )

    # Grab one batch and verify shapes
    batch = next(iter(train_loader))

    print("\n── Batch shape verification ──")
    print("image shape:        ", batch['image'].shape)         # [4, 3, 256, 256]
    print("age shape:          ", batch['age'].shape)           # [4]
    print("sex shape:          ", batch['sex'].shape)           # [4]
    print("localization shape: ", batch['localization'].shape)  # [4]
    print("label shape:        ", batch['label'].shape)         # [4]

    print("\n── Sample values ──")
    print("age values:  ", batch['age'])
    print("sex values:  ", batch['sex'])
    print("label values:", batch['label'])
    print("class names: ", [IDX_TO_CLASS[l.item()] for l in batch['label']])

    print("\n✅ Dataset class working correctly")
```

---

### Step 4 — Run and verify

```
cd ml
venv\Scripts\activate
python src\dataset.py
```

Expected output:
```
Total images in CSV: 10015
Train: 7011 | Val: 2003 | Test: 1001

── Batch shape verification ──
image shape:         torch.Size([4, 3, 256, 256])
age shape:           torch.Size([4])
sex shape:           torch.Size([4])
localization shape:  torch.Size([4])
label shape:         torch.Size([4])

── Sample values ──
age values:  tensor([0.5294, 0.7059, 0.4118, 0.6000])
sex values:  tensor([0, 1, 0, 0])
label values: tensor([0, 1, 0, 2])
class names:  ['NV', 'MEL', 'NV', 'BKL']

✅ Dataset class working correctly
```

If you see these shapes, the dataset is working. Commit it:
```
git add ml\src\dataset.py
git commit -m "feat: add HAM10000 Dataset class with stratified split"
git push
```

---

## Day 3 — Class Imbalance & Focal Loss Intuition

**All 3 people · ~2 hrs · notebook + discussion**

---

### Why this matters so much

Before writing the loss function in week 6, you need to deeply understand the problem. Create `notebooks\week2_imbalance.ipynb`:

**Cell 1 — Visualise the imbalance problem:**
```python
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

df = pd.read_csv(r"data\raw\HAM10000_metadata.csv")
counts = df['dx'].value_counts()

# Show how extreme the imbalance is
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# Raw counts
colors = ['#2ecc71' if c == 'nv' else '#e74c3c' for c in counts.index]
counts.plot(kind='bar', ax=ax1, color=colors)
ax1.set_title("Raw class counts\n(Green=majority, Red=minority)")
ax1.set_ylabel("Number of images")
ax1.tick_params(axis='x', rotation=45)

# Percentage
pct = (counts / len(df) * 100)
pct.plot(kind='bar', ax=ax2, color=colors)
ax2.set_title("Percentage of dataset")
ax2.set_ylabel("Percentage (%)")
ax2.tick_params(axis='x', rotation=45)

plt.tight_layout()
plt.savefig("notebooks\imbalance_chart.png")
plt.show()

print(f"Most common (NV):   {counts['nv']:4d} images = {counts['nv']/len(df)*100:.1f}%")
print(f"Least common (DF):  {counts['df']:4d} images = {counts['df']/len(df)*100:.1f}%")
print(f"Ratio: NV is {counts['nv']//counts['df']}x more common than DF")
```

**Cell 2 — Simulate a dumb model:**
```python
# A model that just predicts NV for everything
# would get 67% accuracy without learning anything useful

total = len(df)
nv_count = counts['nv']

dumb_accuracy = nv_count / total
print(f"Dumb model accuracy (always predict NV): {dumb_accuracy*100:.1f}%")
print(f"\nBut this model is USELESS for:")
print(f"  - Melanoma: would miss ALL {counts['mel']} cases")
print(f"  - DF: would miss ALL {counts['df']} cases")
print(f"  - VASC: would miss ALL {counts['vasc']} cases")
print(f"\nIn medicine, missing melanoma = patient dies.")
print(f"High overall accuracy means nothing if rare classes are missed.")
```

**Cell 3 — Understand focal loss formula:**
```python
import torch
import torch.nn.functional as F
import matplotlib.pyplot as plt
import numpy as np

# Normal cross-entropy loss
# L = -log(p)    where p = probability of correct class

# Focal loss
# L = -(1-p)^gamma * log(p)

# The key insight: (1-p)^gamma is the modulating factor
# When p is HIGH (model is confident and correct) → (1-p) is small → loss is reduced
# When p is LOW (model is wrong) → (1-p) is large → loss stays high
# This makes the model focus on hard, misclassified examples

# Visualise the difference
p = np.linspace(0.01, 0.99, 100)    # predicted probability of correct class

ce_loss    = -np.log(p)              # standard cross-entropy
focal_g1   = -(1-p)**1 * np.log(p)  # focal loss γ=1
focal_g2   = -(1-p)**2 * np.log(p)  # focal loss γ=2 (what we use)
focal_g5   = -(1-p)**5 * np.log(p)  # focal loss γ=5

plt.figure(figsize=(10, 5))
plt.plot(p, ce_loss,  label='Cross-entropy (γ=0)', linewidth=2)
plt.plot(p, focal_g1, label='Focal loss γ=1', linewidth=2)
plt.plot(p, focal_g2, label='Focal loss γ=2 ← we use this', linewidth=2.5, color='red')
plt.plot(p, focal_g5, label='Focal loss γ=5', linewidth=2)
plt.xlabel("Predicted probability of correct class")
plt.ylabel("Loss")
plt.title("Focal Loss vs Cross-Entropy\nFocal loss reduces weight of easy examples")
plt.legend()
plt.ylim(0, 4)
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("notebooks\focal_loss_comparison.png")
plt.show()

print("Key insight:")
print("At p=0.9 (easy example):")
print(f"  CE loss:    {-np.log(0.9):.3f}")
print(f"  Focal γ=2:  {-(1-0.9)**2 * np.log(0.9):.3f}  ← {(1-(1-0.9)**2 * np.log(0.9) / (-np.log(0.9)))*100:.0f}% reduction")
print(f"\nAt p=0.1 (hard example):")
print(f"  CE loss:    {-np.log(0.1):.3f}")
print(f"  Focal γ=2:  {-(1-0.1)**2 * np.log(0.1):.3f}  ← similar weight kept")
```

**Cell 4 — Label smoothing intuition:**
```python
# Label smoothing prevents overconfidence
# Instead of hard labels [0, 0, 1, 0, 0, 0, 0]
# we use soft labels [0.014, 0.014, 0.9, 0.014, 0.014, 0.014, 0.014]

# Why? If the model becomes TOO confident about NV
# it assigns near-zero probability to all other classes
# even when they appear

epsilon = 0.1
num_classes = 7
hard_label = [0, 0, 1, 0, 0, 0, 0]

soft_label = [(1 - epsilon) * h + epsilon / num_classes for h in hard_label]

print("Hard label:", hard_label)
print("Soft label:", [round(x, 3) for x in soft_label])
print(f"\nCorrect class target: {soft_label[2]:.3f} instead of 1.0")
print(f"Other classes target: {soft_label[0]:.3f} instead of 0.0")
print(f"\nThis prevents the model from saying 'I am 100% sure this is NV'")
print(f"which would make it impossible to learn rare classes")
```

Save and commit this notebook:
```
git add ml\notebooks\week2_imbalance.ipynb
git commit -m "docs: add class imbalance and focal loss analysis notebook"
git push
```

---

## Day 4 — SAM Preprocessing: First Attempt

**Sameer leads · Ridam and Sana follow then replicate · ~3 hrs**

Sameer runs through all steps while sharing screen. Ridam and Sana watch, ask questions, then replicate the exact same steps on their own laptops.

---

### What SAM does for us

SAM (Segment Anything Model) draws a mask around the lesion in a dermoscopic image, letting us crop out only the clinically relevant region and discard:
- Body hair that crosses the lesion
- Ruler markings at image edges  
- Ink annotations
- Dark vignetting around the image border

Without this, the model learns to classify based on artifacts (e.g. "images with a ruler marking tend to be melanoma") instead of actual lesion features.

---

### Step 1 — Download SAM checkpoint

In ML venv:
```
cd ml
venv\Scripts\activate

pip install segment-anything
pip install opencv-python

mkdir checkpoints
```

Download the SAM ViT-B checkpoint (~375MB):
```
curl -L https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth -o checkpoints\sam_vit_b.pth
```

If `curl` doesn't work, download manually from:  
https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth  
Save to `ml\checkpoints\sam_vit_b.pth`

---

### Step 2 — Explore SAM in a notebook

Create `notebooks\week2_sam_test.ipynb`:

**Cell 1 — Load SAM:**
```python
import torch
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
from segment_anything import sam_model_registry, SamAutomaticMaskGenerator

# Load SAM model
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

sam = sam_model_registry["vit_b"](checkpoint=r"checkpoints\sam_vit_b.pth")
sam.to(device=device)
print("SAM loaded successfully")
```

**Cell 2 — Load a test image:**
```python
import os

# Pick any image from HAM10000
test_image_path = r"data\raw\HAM10000_images_part_1\ISIC_0024306.jpg"
# If that doesn't exist, list available images and pick one:
files = os.listdir(r"data\raw\HAM10000_images_part_1")
print("First 5 files:", files[:5])

image = np.array(Image.open(test_image_path).convert("RGB"))
print("Image shape:", image.shape)    # (450, 600, 3) — original HAM10000 size

plt.figure(figsize=(8, 5))
plt.imshow(image)
plt.title("Original dermoscopic image")
plt.axis('off')
plt.show()
```

**Cell 3 — Run SAM automatic mask generation:**
```python
# SamAutomaticMaskGenerator finds ALL segments in the image
mask_generator = SamAutomaticMaskGenerator(
    model=sam,
    points_per_side=16,         # density of prompt points
    pred_iou_thresh=0.88,       # minimum quality threshold
    stability_score_thresh=0.95,
    min_mask_region_area=500,   # ignore very small segments (hair strands)
)

print("Running SAM... (takes ~10 seconds on CPU, ~2 seconds on GPU)")
masks = mask_generator.generate(image)
print(f"Found {len(masks)} segments")

# Each mask has: segmentation, area, bbox, predicted_iou, stability_score
print("\nLargest mask:")
largest = sorted(masks, key=lambda x: x['area'], reverse=True)[0]
print(f"  Area: {largest['area']} pixels")
print(f"  IoU:  {largest['predicted_iou']:.3f}")
print(f"  Bbox: {largest['bbox']}")    # [x, y, width, height]
```

**Cell 4 — Visualise all segments:**
```python
def show_all_masks(image, masks):
    plt.figure(figsize=(12, 5))
    
    plt.subplot(1, 2, 1)
    plt.imshow(image)
    plt.title("Original image")
    plt.axis('off')
    
    # Overlay all masks with different colours
    overlay = image.copy()
    colours = plt.cm.Set1(np.linspace(0, 1, len(masks)))
    
    plt.subplot(1, 2, 2)
    plt.imshow(image)
    for i, mask_data in enumerate(masks):
        mask = mask_data['segmentation']
        colour = np.array(colours[i][:3])
        coloured_mask = np.zeros_like(image, dtype=float)
        coloured_mask[mask] = colour
        plt.imshow(coloured_mask, alpha=0.4)
    
    plt.title(f"SAM found {len(masks)} segments")
    plt.axis('off')
    plt.tight_layout()
    plt.show()

show_all_masks(image, masks)
```

**Cell 5 — Extract the lesion (largest central segment):**
```python
def get_lesion_mask(masks, image_shape):
    """
    Strategy: the lesion is usually the largest segment
    near the centre of the image.
    """
    h, w = image_shape[:2]
    centre_y, centre_x = h // 2, w // 2
    
    best_mask = None
    best_score = -1
    
    for mask_data in masks:
        seg = mask_data['segmentation']
        area = mask_data['area']
        
        # Find centre of this segment
        ys, xs = np.where(seg)
        if len(ys) == 0:
            continue
        seg_cy = ys.mean()
        seg_cx = xs.mean()
        
        # Distance from image centre
        dist = ((seg_cy - centre_y)**2 + (seg_cx - centre_x)**2)**0.5
        max_dist = (h**2 + w**2)**0.5
        
        # Score: larger area + closer to centre = better
        score = (area / (h * w)) - 0.3 * (dist / max_dist)
        
        if score > best_score:
            best_score = score
            best_mask = seg
    
    return best_mask

lesion_mask = get_lesion_mask(masks, image.shape)

# Apply mask — set everything outside lesion to black
masked_image = image.copy()
masked_image[~lesion_mask] = 0

plt.figure(figsize=(12, 5))
plt.subplot(1, 3, 1)
plt.imshow(image)
plt.title("Original")
plt.axis('off')

plt.subplot(1, 3, 2)
plt.imshow(lesion_mask, cmap='gray')
plt.title("Lesion mask")
plt.axis('off')

plt.subplot(1, 3, 3)
plt.imshow(masked_image)
plt.title("Masked lesion")
plt.axis('off')

plt.tight_layout()
plt.show()
```

**Cell 6 — Apply CLAHE on the lesion:**
```python
import cv2

def apply_clahe(image_rgb, clip_limit=2.0, tile_grid=(8, 8)):
    """
    Apply CLAHE (Contrast Limited Adaptive Histogram Equalization).
    Works on LAB colour space to enhance contrast without changing hue.
    """
    # Convert RGB → LAB (L=lightness, A=green-red, B=blue-yellow)
    lab = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2LAB)
    
    # Apply CLAHE only to L channel (lightness)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid)
    lab[:, :, 0] = clahe.apply(lab[:, :, 0])
    
    # Convert back to RGB
    enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
    return enhanced

# Apply CLAHE to masked lesion only
clahe_image = apply_clahe(masked_image)

plt.figure(figsize=(12, 4))
plt.subplot(1, 3, 1)
plt.imshow(image)
plt.title("1. Original")
plt.axis('off')

plt.subplot(1, 3, 2)
plt.imshow(masked_image)
plt.title("2. After SAM masking")
plt.axis('off')

plt.subplot(1, 3, 3)
plt.imshow(clahe_image)
plt.title("3. After CLAHE enhancement")
plt.axis('off')

plt.tight_layout()
plt.savefig(r"notebooks\sam_clahe_pipeline.png")
plt.show()

print("SAM + CLAHE pipeline working ✅")
print("This is what every image will look like before going into the model")
```

Save the notebook, commit:
```
git add ml\notebooks\week2_sam_test.ipynb
git add ml\notebooks\sam_clahe_pipeline.png
git commit -m "feat: SAM + CLAHE preprocessing first working attempt"
git push
```

---

### After Sameer finishes — Ridam and Sana replicate

Ridam and Sana each open the same notebook on their own laptops and run every cell themselves. Do not just watch — running it yourself is the only way to understand it.

---

## Day 5 — Backend: Mock /predict Endpoint

**Ridam leads · Sameer and Sana follow then replicate · ~2.5 hrs**

The goal is a fully working `/predict` endpoint that accepts the exact same multipart form data as the final real endpoint but returns hardcoded fake JSON. The shape of the response must match the API contract exactly.

---

### Step 1 — Create Pydantic response schema

Open `backend\app\schemas\predict.py`:

```python
"""
predict.py — Pydantic models for /predict request and response.
These define the exact shape of data in and out of the API.
"""

from pydantic import BaseModel
from typing import Dict


class PredictionResponse(BaseModel):
    """
    Response returned by POST /predict.
    All fields must be present — frontend depends on every one of them.
    """
    predicted_class: str           # e.g. "MEL", "NV", "BKL"
    confidence: float              # 0.0 to 1.0
    probabilities: Dict[str, float]  # all 7 classes with their probabilities
    gradcam_image: str             # base64 encoded PNG string


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
```

---

### Step 2 — Write the mock predict router

Open `backend\app\routers\predict.py`:

```python
"""
predict.py — API router for /predict and /health endpoints.
Week 2: returns mock data. Week 8: replaced with real model inference.
"""

import base64
import io
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.predict import PredictionResponse, HealthResponse

router = APIRouter()

# Valid lesion localizations from HAM10000
VALID_LOCALIZATIONS = {
    'back', 'lower extremity', 'trunk', 'upper extremity',
    'abdomen', 'face', 'hand', 'foot', 'scalp',
    'neck', 'ear', 'genital', 'acral'
}

VALID_SEX = {'male', 'female'}


def _make_fake_gradcam_base64() -> str:
    """
    Returns a small red PNG as base64 — placeholder for real GradCAM heatmap.
    Frontend uses this to test the GradCAMViewer component.
    """
    # 10x10 red PNG in base64 (hardcoded — no image library needed)
    red_png_b64 = (
        "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8"
        "z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg=="
    )
    return red_png_b64


@router.get("/health", response_model=HealthResponse)
def health_check():
    """Returns API health status."""
    return HealthResponse(status="ok", model_loaded=False)
    # model_loaded=False because real model not loaded yet


@router.post("/predict", response_model=PredictionResponse)
async def predict(
    image:        UploadFile = File(...,  description="Dermoscopic image (JPEG/PNG)"),
    age:          int        = Form(...,  description="Patient age 1-120"),
    sex:          str        = Form(...,  description="Patient sex: male or female"),
    localization: str        = Form(...,  description="Anatomical lesion location"),
):
    """
    Accepts dermoscopic image + patient metadata.
    Returns predicted lesion class, confidence, all 7 probabilities, GradCAM heatmap.
    """

    # ── Validation ──────────────────────────────────────────────────────────

    # Check image type
    if image.content_type not in {"image/jpeg", "image/png"}:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{image.content_type}'. Only JPEG and PNG accepted."
        )

    # Read image bytes and check size
    contents = await image.read()
    if len(contents) > 10 * 1024 * 1024:    # 10MB limit
        raise HTTPException(
            status_code=413,
            detail=f"File size {len(contents)/(1024*1024):.1f}MB exceeds 10MB limit."
        )

    # Validate age
    if not (1 <= age <= 120):
        raise HTTPException(
            status_code=400,
            detail=f"Age {age} is invalid. Must be between 1 and 120."
        )

    # Validate sex
    if sex.lower() not in VALID_SEX:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sex '{sex}'. Must be 'male' or 'female'."
        )

    # Validate localization
    if localization.lower() not in VALID_LOCALIZATIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid localization '{localization}'. Must be one of: {sorted(VALID_LOCALIZATIONS)}"
        )

    # ── Mock response (replace with real inference in Week 8) ───────────────

    print(f"[MOCK] Received image: {image.filename} ({len(contents)/1024:.1f} KB)")
    print(f"[MOCK] Patient: age={age}, sex={sex}, location={localization}")

    mock_response = PredictionResponse(
        predicted_class="MEL",
        confidence=0.87,
        probabilities={
            "MEL":   0.87,
            "NV":    0.06,
            "BKL":   0.03,
            "BCC":   0.02,
            "AKIEC": 0.01,
            "VASC":  0.005,
            "DF":    0.005,
        },
        gradcam_image=_make_fake_gradcam_base64(),
    )

    return mock_response
```

---

### Step 3 — Register the router in main.py

Open `backend\app\main.py` and update it:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import predict

app = FastAPI(
    title="SkinFuseNet API",
    version="0.2.0",
    description="Multimodal skin lesion classification — Week 2 mock",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)
```

---

### Step 4 — Test every case in Swagger

Run the server:
```
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs` and test:

✅ Valid request — upload a real HAM10000 image, age=45, sex=male, localization=back → should return mock JSON  
✅ Wrong file type — upload a .txt file → should return 400  
✅ Wrong sex value — send sex=unknown → should return 400  
✅ Wrong localization — send localization=xyz → should return 400  
✅ Health check → should return `{"status":"ok","model_loaded":false}`

Commit:
```
git add backend\app\routers\predict.py backend\app\schemas\predict.py backend\app\main.py
git commit -m "feat: mock POST /predict endpoint with full validation"
git push
```

---

## Day 6 — Frontend: ImageUpload + MetadataForm

**Sana leads · Sameer and Ridam follow then replicate · ~3 hrs**

---

### Step 1 — Plan components before coding

Draw this on paper or whiteboard before opening VS Code:

```
App.jsx
├── DisclaimerBanner.jsx     (sticky top bar — always visible)
├── ImageUpload.jsx          (drag/drop + preview + validation)
├── MetadataForm.jsx         (age + sex + localization inputs)
└── [ResultsPanel — Day 7]   (not built yet)
```

State lives in App.jsx and flows down as props. The submit button calls `usePrediction` hook which we write on Day 7.

---

### Step 2 — DisclaimerBanner component

Create `frontend\src\components\DisclaimerBanner.jsx`:

```jsx
/**
 * DisclaimerBanner.jsx
 * Sticky medical disclaimer — always visible, cannot be dismissed.
 * Required for any medical AI tool.
 */

function DisclaimerBanner() {
  return (
    <div className="w-full bg-yellow-50 border-b border-yellow-300 px-4 py-3">
      <p className="text-yellow-800 text-sm text-center font-medium">
        ⚠️ <strong>Medical Disclaimer:</strong> SkinFuseNet is a research
        prototype and is <strong>NOT a certified medical device</strong>. It
        must not replace professional dermatological examination. Always consult
        a qualified clinician for diagnosis.
      </p>
    </div>
  )
}

export default DisclaimerBanner
```

---

### Step 3 — ImageUpload component

Create `frontend\src\components\ImageUpload.jsx`:

```jsx
/**
 * ImageUpload.jsx
 * Handles image file selection, validation, and preview.
 * Passes the selected File object up to parent via onFileSelect prop.
 */

import { useState, useRef } from "react"

const MAX_FILE_SIZE = 10 * 1024 * 1024   // 10MB in bytes
const VALID_TYPES   = ["image/jpeg", "image/png"]

function ImageUpload({ onFileSelect }) {
  const [preview, setPreview] = useState(null)
  const [error, setError]     = useState(null)
  const [filename, setFilename] = useState(null)
  const inputRef = useRef(null)

  function validateAndSet(file) {
    // Clear previous state
    setError(null)
    setPreview(null)
    setFilename(null)

    if (!file) return

    // Type check
    if (!VALID_TYPES.includes(file.type)) {
      setError("Only JPEG and PNG images are accepted.")
      onFileSelect(null)
      return
    }

    // Size check
    if (file.size > MAX_FILE_SIZE) {
      setError(`File is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum allowed is 10MB.`)
      onFileSelect(null)
      return
    }

    // Valid — set preview and pass file up to parent
    setPreview(URL.createObjectURL(file))
    setFilename(file.name)
    onFileSelect(file)
  }

  function handleInputChange(e) {
    validateAndSet(e.target.files[0])
  }

  function handleDrop(e) {
    e.preventDefault()
    validateAndSet(e.dataTransfer.files[0])
  }

  function handleDragOver(e) {
    e.preventDefault()    // needed to allow drop
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Dermoscopic Image
      </label>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center
                   cursor-pointer hover:border-blue-400 hover:bg-blue-50
                   transition-colors duration-200"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={handleInputChange}
          className="hidden"
        />

        {preview ? (
          <div>
            <img
              src={preview}
              alt="Selected lesion"
              className="mx-auto max-h-48 rounded-lg object-contain"
            />
            <p className="mt-2 text-sm text-gray-500">{filename}</p>
            <p className="text-xs text-blue-500 mt-1">Click to change image</p>
          </div>
        ) : (
          <div>
            <p className="text-4xl mb-2">🔬</p>
            <p className="text-gray-600 font-medium">
              Drop image here or click to select
            </p>
            <p className="text-gray-400 text-sm mt-1">
              JPEG or PNG · max 10MB
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  )
}

export default ImageUpload
```

---

### Step 4 — MetadataForm component

Create `frontend\src\components\MetadataForm.jsx`:

```jsx
/**
 * MetadataForm.jsx
 * Collects patient metadata: age, sex, lesion localization.
 * Passes values up to parent via onChange prop.
 */

// All 13 localization options from HAM10000 dataset
const LOCALIZATIONS = [
  "back", "lower extremity", "trunk", "upper extremity",
  "abdomen", "face", "hand", "foot", "scalp",
  "neck", "ear", "genital", "acral",
]

function MetadataForm({ values, onChange }) {
  function handleChange(field, value) {
    onChange({ ...values, [field]: value })
  }

  return (
    <div className="w-full space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Patient Information</h3>

      {/* Age */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Age <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min="1"
          max="120"
          placeholder="e.g. 45"
          value={values.age}
          onChange={(e) => handleChange("age", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2
                     text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Sex */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Sex <span className="text-red-500">*</span>
        </label>
        <select
          value={values.sex}
          onChange={(e) => handleChange("sex", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2
                     text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Select sex</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      {/* Localization */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Lesion Location <span className="text-red-500">*</span>
        </label>
        <select
          value={values.localization}
          onChange={(e) => handleChange("localization", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2
                     text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Select location</option>
          {LOCALIZATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc.charAt(0).toUpperCase() + loc.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default MetadataForm
```

---

### Step 5 — Wire everything in App.jsx

```jsx
import { useState } from "react"
import DisclaimerBanner from "./components/DisclaimerBanner"
import ImageUpload from "./components/ImageUpload"
import MetadataForm from "./components/MetadataForm"

function App() {
  const [imageFile, setImageFile] = useState(null)
  const [metadata, setMetadata]   = useState({
    age: "",
    sex: "",
    localization: "",
  })

  // Check if form is complete enough to submit
  const isReady = imageFile && metadata.age && metadata.sex && metadata.localization

  function handleSubmit() {
    // For now — just log values to verify everything is collected
    console.log("Image file:", imageFile.name, imageFile.size)
    console.log("Metadata:", metadata)
    console.log("Ready to send to API ✅")
    alert(`Ready!\nImage: ${imageFile.name}\nAge: ${metadata.age}\nSex: ${metadata.sex}\nLocation: ${metadata.localization}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky disclaimer at top */}
      <DisclaimerBanner />

      {/* Main content */}
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">SkinFuseNet</h1>
        <p className="text-gray-500 text-sm mb-8">
          Multimodal skin lesion classification · Research prototype
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Step 1: Upload */}
          <ImageUpload onFileSelect={setImageFile} />

          {/* Divider */}
          <hr className="border-gray-100" />

          {/* Step 2: Metadata */}
          <MetadataForm values={metadata} onChange={setMetadata} />

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!isReady}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors
              ${isReady
                ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            {isReady ? "Analyse Lesion →" : "Complete all fields to analyse"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
```

Run `npm run dev` and verify:
- Disclaimer shows at top
- Image upload with preview works
- All dropdowns populate correctly
- Button is grey when fields missing, blue when all filled
- Click submit → alert shows all correct values

---

## Day 7 — Connect Frontend to Mock Backend + Weekly Review

**All 3 people together · ~3 hrs**

---

### Step 1 — Write the usePrediction hook

Create `frontend\src\hooks\usePrediction.js`:

```js
/**
 * usePrediction.js
 * Custom React hook that manages the full prediction API call lifecycle.
 * Handles loading state, error state, and result state.
 */

import { useState } from "react"
import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export function usePrediction() {
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)

  async function predict(imageFile, age, sex, localization) {
    setLoading(true)
    setError(null)
    setResult(null)

    // Build FormData — DO NOT set Content-Type manually
    // Axios sets it automatically with the correct boundary string
    const form = new FormData()
    form.append("image", imageFile)
    form.append("age", age)
    form.append("sex", sex)
    form.append("localization", localization)

    try {
      const response = await axios.post(`${BASE_URL}/predict`, form)
      setResult(response.data)
      console.log("API response:", response.data)
    } catch (err) {
      const message = err.response?.data?.detail || "Something went wrong. Is the backend running?"
      setError(message)
      console.error("API error:", err)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setLoading(false)
    setResult(null)
    setError(null)
  }

  return { predict, loading, result, error, reset }
}
```

---

### Step 2 — Wire the hook into App.jsx

Update `App.jsx` to use the hook and show the response:

```jsx
import { useState } from "react"
import DisclaimerBanner from "./components/DisclaimerBanner"
import ImageUpload from "./components/ImageUpload"
import MetadataForm from "./components/MetadataForm"
import { usePrediction } from "./hooks/usePrediction"

function App() {
  const [imageFile, setImageFile] = useState(null)
  const [metadata, setMetadata]   = useState({ age: "", sex: "", localization: "" })
  const { predict, loading, result, error, reset } = usePrediction()

  const isReady = imageFile && metadata.age && metadata.sex && metadata.localization

  async function handleSubmit() {
    await predict(imageFile, metadata.age, metadata.sex, metadata.localization)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DisclaimerBanner />

      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">SkinFuseNet</h1>
        <p className="text-gray-500 text-sm mb-8">Multimodal skin lesion classification</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          <ImageUpload onFileSelect={setImageFile} />
          <hr className="border-gray-100" />
          <MetadataForm values={metadata} onChange={setMetadata} />

          <button
            onClick={handleSubmit}
            disabled={!isReady || loading}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors
              ${isReady && !loading
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            {loading ? "Analysing..." : isReady ? "Analyse Lesion →" : "Complete all fields"}
          </button>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">⚠️ {error}</p>
            </div>
          )}

          {/* Result — raw JSON for now, proper UI in Week 10 */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold mb-2">
                ✅ Prediction: {result.predicted_class} ({(result.confidence * 100).toFixed(1)}% confidence)
              </p>
              <details>
                <summary className="text-xs text-green-600 cursor-pointer">Show full API response</summary>
                <pre className="text-xs text-gray-600 mt-2 overflow-auto">
                  {JSON.stringify({ ...result, gradcam_image: "[base64 string]" }, null, 2)}
                </pre>
              </details>
              <button
                onClick={reset}
                className="mt-3 text-xs text-green-700 underline"
              >
                Try another image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
```

---

### Step 3 — Test the full flow

Make sure both servers are running in separate terminals:

**Terminal 1 (backend):**
```
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 (frontend):**
```
cd frontend
npm run dev
```

Open `http://localhost:5173` and do the complete flow:
1. Upload a HAM10000 image
2. Fill in age, sex, location
3. Click Analyse
4. See "Prediction: MEL (87.0% confidence)" appear

If this works — the entire frontend-to-backend pipeline is connected. ✅

Commit everything:
```
git add frontend\src\hooks\usePrediction.js frontend\src\App.jsx
git commit -m "feat: connect frontend to mock backend via usePrediction hook"
git push
```

---

### Step 4 — Weekly review (30 mins)

Each person answers out loud:
1. What did I finish this week?
2. What am I still confused about?
3. What do I need to understand better before week 3?

Write answers in `team\week2_review.md`:
```
git add team\week2_review.md
git commit -m "docs: week 2 review"
git push
```

---

## Week 2 Checklist

All items must be ticked before starting Week 3.

### ML
- [ ] `pytorch_deepdive.ipynb` — all 6 cells run without errors
- [ ] Can explain tensor shape `[32, 3, 256, 256]` in plain words
- [ ] Can explain what `loss.backward()` does
- [ ] `dataset.py` runs and prints correct shapes
- [ ] Batch image shape is `[4, 3, 256, 256]`
- [ ] Batch label shape is `[4]`
- [ ] Train: 7011, Val: 2003, Test: 1001 printed
- [ ] `week2_imbalance.ipynb` — imbalance chart and focal loss chart saved
- [ ] Can explain why focal loss reduces weight on easy NV examples
- [ ] SAM runs on one HAM10000 image and shows a lesion mask
- [ ] CLAHE applied to masked image, before/after visible

### Backend
- [ ] `POST /predict` accepts multipart form with image + 3 metadata fields
- [ ] Returns correct JSON shape matching API contract
- [ ] 400 error for wrong file type works
- [ ] 413 error for file over 10MB works
- [ ] 400 error for invalid sex works
- [ ] 400 error for invalid localization works
- [ ] All tests pass in Swagger UI

### Frontend
- [ ] DisclaimerBanner shows at top of page and cannot be dismissed
- [ ] ImageUpload shows thumbnail preview for valid images
- [ ] ImageUpload shows error for wrong file type
- [ ] ImageUpload shows error for files over 10MB
- [ ] MetadataForm has all 13 localization options in dropdown
- [ ] Submit button is disabled until all 3 metadata fields + image are filled
- [ ] `usePrediction.js` hook created
- [ ] Clicking Analyse sends request to mock backend
- [ ] Prediction result (MEL, 87%) appears on screen
- [ ] "Try another image" resets the form

### Team
- [ ] All new files committed and pushed to GitHub
- [ ] `team\week2_review.md` written and committed
- [ ] Each person can explain what the other two built this week

---

## Common Errors & Fixes

### dataset.py — FileNotFoundError for image
```
FileNotFoundError: Image not found: ISIC_0024306
```
**Fix:** The image paths in `IMAGE_DIRS` are wrong. Update them to match exactly where you extracted HAM10000:
```python
IMAGE_DIRS = [
    r"C:\Users\YourName\Documents\skinfusenet\ml\data\raw\HAM10000_images_part_1",
    r"C:\Users\YourName\Documents\skinfusenet\ml\data\raw\HAM10000_images_part_2",
]
```

---

### DataLoader hangs on Windows
**Symptom:** `next(iter(train_loader))` runs forever and never returns.  
**Fix:** Set `num_workers=0` in all DataLoaders. Windows has issues with multiprocessing in DataLoader — 0 means it runs on the main thread which always works.

---

### SAM — CUDA out of memory
```
RuntimeError: CUDA out of memory
```
**Fix:** SAM uses a lot of GPU memory. Either use CPU mode:
```python
sam.to(device="cpu")
```
Or reduce `points_per_side` from 32 to 8 in `SamAutomaticMaskGenerator`.

---

### FastAPI 422 Unprocessable Entity
**Symptom:** POST /predict returns 422 even with correct data.  
**Cause 1:** Missing a required form field — check all 4 fields are present (image, age, sex, localization).  
**Cause 2:** `age` is being sent as a string instead of integer — FastAPI expects `int`. If you send `"45"` it should still coerce correctly, but verify.  
**Fix:** Open Swagger /docs, check the error response body — it shows exactly which field failed and why.

---

### Axios 400/422 from frontend
**Symptom:** API call fails even though Swagger works fine.  
**Most likely cause:** You manually set `Content-Type: multipart/form-data` in the axios call.  
**Fix:** Remove the Content-Type header entirely. Axios sets it automatically with the boundary string that FastAPI needs to parse the form data. Setting it manually removes the boundary and breaks parsing.

```js
// ❌ WRONG
axios.post('/predict', form, { headers: { 'Content-Type': 'multipart/form-data' } })

// ✅ CORRECT  
axios.post('/predict', form)
```

---

### npm install fails — node-gyp error
```
gyp ERR! build error
```
**Fix:** Install Python build tools:
```
npm install --global windows-build-tools
```
Or install Visual Studio Build Tools from https://visualstudio.microsoft.com/visual-cpp-build-tools/

---

### React — Cannot read properties of null
**Symptom:** App crashes when clicking submit before selecting an image.  
**Fix:** Add a guard before using the file:
```js
if (!imageFile) return
```
The `isReady` check in App.jsx should prevent this but add the guard in the hook too.

---

## Resources

### ML / PyTorch — Week 2 specific
| Resource | Link | What it covers |
|----------|------|----------------|
| PyTorch Dataset & DataLoader tutorial | https://pytorch.org/tutorials/beginner/data_loading_tutorial.html | Official guide |
| CampusX — Custom Dataset (Hindi) | YouTube → search "CampusX custom dataset pytorch" | Hindi explanation |
| Focal Loss paper (short) | https://arxiv.org/abs/1708.02002 | Original paper — read Section 3 only |
| SAM paper | https://arxiv.org/abs/2304.02643 | Background on SAM |

### Backend / FastAPI — Week 2 specific
| Resource | Link | What it covers |
|----------|------|----------------|
| FastAPI File Uploads | https://fastapi.tiangolo.com/tutorial/request-files/ | Multipart uploads |
| FastAPI Form Data | https://fastapi.tiangolo.com/tutorial/request-forms/ | Form fields |
| Pydantic v2 docs | https://docs.pydantic.dev/latest/ | Data validation |

### Frontend / React — Week 2 specific
| Resource | Link | What it covers |
|----------|------|----------------|
| React custom hooks | https://react.dev/learn/reusing-logic-with-custom-hooks | Official guide |
| Axios FormData | https://axios-http.com/docs/multipart | File uploads with axios |
| Tailwind components | https://tailwindui.com/components | Pre-built UI components |

---

> **Next up → Week 3:** Full SAM preprocessing pipeline over all 10,015 images, CLAHE on every image, MixUp + CutMix + RSPDA augmentation pipeline, save processed images to disk.

---

<p align="center">SkinFuseNet · Week 2 · All 3 team members</p>