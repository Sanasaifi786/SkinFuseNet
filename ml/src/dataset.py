import os
import torch
import pandas as pd
import numpy as np
from pathlib import Path
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from sklearn.model_selection import train_test_split

from src.preprocess.image_utils import load_and_preprocess_image
from src.branches.bert import MetadataTokenizer

# ── Label mapping (HAM10000 standard) ────────────────────────────────────────
CLASS_MAP = {
    'akiec': 0,
    'bcc':   1,
    'bkl':   2,
    'df':    3,
    'mel':   4,
    'nv':    5,
    'vasc':  6
}

IDX_TO_CLASS = {v: k.upper() for k, v in CLASS_MAP.items()}


# ── Dataset class ─────────────────────────────────────────────────────────────
class SkinLesionDataset(Dataset):
    """
    PyTorch Dataset for HAM10000 skin lesion classification.

    Each sample returns:
        image          : FloatTensor [3, 256, 256]  — normalised lesion image
        input_ids      : LongTensor  [128]          — BERT token IDs
        attention_mask : LongTensor  [128]          — BERT attention mask
        label          : LongTensor  scalar         — class index 0-6
    """

    def __init__(self, dataframe, img_dir, transform=None):
        """
        Args:
            dataframe  : pandas DataFrame already filtered and split externally.
            img_dir    : path to the processed/CLAHE images folder.
            transform  : torchvision transforms to apply to each image.
        """
        self.df        = dataframe.reset_index(drop=True)
        self.img_dir   = Path(img_dir)
        self.transform = transform

        # Tokenizer loaded once per dataset — NOT inside __getitem__
        self.tokenizer = MetadataTokenizer()

        # Print summary so you know what loaded
        print(f"  Dataset ready: {len(self.df)} samples")

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]

        # ── 1. Image ──────────────────────────────────────────────────────────
        img_path = self.img_dir / f"{row['image_id']}.jpg"
        image    = load_and_preprocess_image(img_path, self.transform)

        # ── 2. Metadata tokenisation ──────────────────────────────────────────
        age          = int(row['age'])
        sex          = str(row['sex']).lower().strip()
        localization = str(row['localization']).lower().strip()

        tokens         = self.tokenizer.tokenize(age, sex, localization)
        input_ids      = tokens['input_ids'].squeeze(0)       # [128]
        attention_mask = tokens['attention_mask'].squeeze(0)  # [128]

        # ── 3. Label ──────────────────────────────────────────────────────────
        label_str = str(row['dx']).lower().strip()
        if label_str not in CLASS_MAP:
            raise ValueError(
                f"Unknown class '{label_str}' at index {idx} "
                f"(image_id={row['image_id']}). "
                f"Valid classes: {list(CLASS_MAP.keys())}"
            )
        label = CLASS_MAP[label_str]

        return {
            'image':          image,
            'input_ids':      input_ids,
            'attention_mask': attention_mask,
            'label':          torch.tensor(label, dtype=torch.long),
        }


# ── Data loading utility ──────────────────────────────────────────────────────
def get_splits(
    csv_path,
    img_dir,
    batch_size=32,
    seed=42,
):
    """
    Reads HAM10000 CSV, filters to images that exist on disk,
    splits 70% train / 20% val / 10% test (stratified by class),
    and returns three DataLoaders.

    Args:
        csv_path   : path to HAM10000_metadata.csv
        img_dir    : path to processed image folder
        batch_size : images per batch
        seed       : random seed for reproducibility

    Returns:
        train_loader, val_loader, test_loader
    """
    img_dir = Path(img_dir)

    # ── Step 1: Load and clean CSV ────────────────────────────────────────────
    df = pd.read_csv(csv_path)
    df.dropna(subset=['image_id', 'dx'], inplace=True)
    df['dx'] = df['dx'].str.lower().str.strip()

    # ── Step 2: Filter rows whose image file actually exists ──────────────────
    # Vectorised — much faster than iterrows() on 10,015 rows
    before = len(df)
    df = df[df['image_id'].apply(
        lambda x: (img_dir / f"{x}.jpg").exists()
    )].reset_index(drop=True)
    after = len(df)
    if before != after:
        print(f"  ⚠️  Dropped {before - after} rows with missing images "
              f"({after}/{before} images found on disk).")

    # ── Step 3: Impute missing metadata ──────────────────────────────────────
    median_age        = df['age'].median()
    df['age']         = df['age'].fillna(median_age)
    df['sex']         = df['sex'].fillna('unknown')
    df['localization'] = df['localization'].fillna('unknown')

    # ── Step 4: Stratified split — 70 / 20 / 10 ─────────────────────────────
    # First cut: 90% trainval, 10% test
    df_trainval, df_test = train_test_split(
        df, test_size=0.10,
        stratify=df['dx'], random_state=seed
    )
    # Second cut: from trainval — 77.8% train (= 70% of total), 22.2% val (= 20% of total)
    df_train, df_val = train_test_split(
        df_trainval, test_size=0.222,
        stratify=df_trainval['dx'], random_state=seed
    )

    print(f"\nDataset split (seed={seed}):")
    print(f"  Train : {len(df_train):5d} samples")
    print(f"  Val   : {len(df_val):5d} samples")
    print(f"  Test  : {len(df_test):5d} samples")
    print(f"  Total : {len(df):5d} samples\n")

    # ── Step 5: Transforms ────────────────────────────────────────────────────
    # ToPILImage() in BOTH train and val — load_and_preprocess_image returns numpy
    train_transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.5),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])

    val_transform = transforms.Compose([
        transforms.ToPILImage(),   # ← was missing — caused val/test crash
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])

    # ── Step 6: Create Dataset objects ───────────────────────────────────────
    print("Building datasets...")
    train_dataset = SkinLesionDataset(df_train, img_dir, transform=train_transform)
    val_dataset   = SkinLesionDataset(df_val,   img_dir, transform=val_transform)
    test_dataset  = SkinLesionDataset(df_test,  img_dir, transform=val_transform)

    # ── Step 7: DataLoaders ───────────────────────────────────────────────────
    # num_workers=0 is mandatory on Windows — multiprocessing DataLoader crashes otherwise
    train_loader = DataLoader(
        train_dataset, batch_size=batch_size,
        shuffle=True,  num_workers=0, pin_memory=True
    )
    val_loader = DataLoader(
        val_dataset, batch_size=batch_size,
        shuffle=False, num_workers=0, pin_memory=True
    )
    test_loader = DataLoader(
        test_dataset, batch_size=batch_size,
        shuffle=False, num_workers=0, pin_memory=True
    )

    return train_loader, val_loader, test_loader


# ── Quick verification ────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    # Anchor to ml/ directory so this works from any CWD
    _ml_dir = Path(__file__).resolve().parents[1]
    CSV_PATH = str(_ml_dir / "data" / "raw" / "HAM10000_metadata.csv")
    IMG_DIR  = str(_ml_dir / "data" / "processed")

    print("=" * 55)
    print("Running dataset.py verification...")
    print("=" * 55)

    train_loader, val_loader, test_loader = get_splits(
        CSV_PATH, IMG_DIR, batch_size=4
    )

    batch = next(iter(train_loader))

    print("\nBatch shape verification:")
    print(f"  image shape         : {batch['image'].shape}")          # [4, 3, H, W]
    print(f"  input_ids shape     : {batch['input_ids'].shape}")      # [4, 128]
    print(f"  attention_mask shape: {batch['attention_mask'].shape}") # [4, 128]
    print(f"  label shape         : {batch['label'].shape}")          # [4]

    print("\nDtype check:")
    print(f"  image dtype         : {batch['image'].dtype}")          # float32
    print(f"  input_ids dtype     : {batch['input_ids'].dtype}")      # int64
    print(f"  label dtype         : {batch['label'].dtype}")          # int64

    print("\nValue range check:")
    print(f"  image min           : {batch['image'].min():.3f}")      # approx -2.5
    print(f"  image max           : {batch['image'].max():.3f}")      # approx  2.5
    print(f"  label values        : {batch['label'].tolist()}")       # 0-6
    print(f"  class names         : {[IDX_TO_CLASS[l.item()] for l in batch['label']]}")

    print("\n✅ dataset.py verification complete.")