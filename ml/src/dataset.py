import os
import torch
import pandas as pd
import numpy as np
import cv2
from pathlib import Path
from torch.utils.data import Dataset
from torchvision import transforms

# Import Person B's Tokenizer
from src.branches.bert import MetadataTokenizer

# Standard HAM10000 mapping
CLASS_MAP = {
    'akiec': 0,
    'bcc': 1,
    'bkl': 2,
    'df': 3,
    'mel': 4,
    'nv': 5,
    'vasc': 6
}

class SkinLesionDataset(Dataset):
    def __init__(self, csv_path, img_dir, is_train=True, transform=None):
        """
        Args:
            csv_path (str): Path to HAM10000 metadata CSV.
            img_dir (str): Path to the processed images directory (e.g., CLAHE outputs).
            is_train (bool): True for training set (applies augmentation if provided).
            transform: torchvision transforms.
        """
        self.img_dir = Path(img_dir)
        self.transform = transform
        self.is_train = is_train
        
        # Load metadata
        self.df = pd.read_csv(csv_path)
        
        # Clean and impute missing data
        self._clean_data()
        
        # Initialize Tokenizer
        self.tokenizer = MetadataTokenizer()
        
    def _clean_data(self):
        # Drop rows with missing essential image_id or dx
        self.df.dropna(subset=['image_id', 'dx'], inplace=True)
        
        # Impute age: fill missing with median age
        median_age = self.df['age'].median()
        self.df['age'] = self.df['age'].fillna(median_age)
        
        # Impute sex and localization with 'unknown'
        self.df['sex'] = self.df['sex'].fillna('unknown')
        self.df['localization'] = self.df['localization'].fillna('unknown')
        
    def __len__(self):
        return len(self.df)
        
    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        
        # 1. Image Loading
        img_name = f"{row['image_id']}.jpg"
        img_path = self.img_dir / img_name
        
        # Fallback if image doesn't exist
        if not img_path.exists():
            # Return a blank black image
            image = np.zeros((256, 256, 3), dtype=np.uint8)
        else:
            image = cv2.imread(str(img_path))
            if image is None:
                image = np.zeros((256, 256, 3), dtype=np.uint8)
            else:
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                
        # Resize all to 256x256
        image = cv2.resize(image, (256, 256))
        
        if self.transform:
            image = self.transform(image)
        else:
            # Default transform if none provided
            default_transform = transforms.Compose([
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            image = default_transform(image)
            
        # 2. Metadata Tokenization
        age = int(row['age'])
        sex = str(row['sex']).lower()
        localization = str(row['localization']).lower()
        
        tokens = self.tokenizer.tokenize(age, sex, localization)
        input_ids = tokens['input_ids'].squeeze(0) # Remove batch dim
        attention_mask = tokens['attention_mask'].squeeze(0)
        
        # 3. Label
        label_str = str(row['dx']).lower()
        label = CLASS_MAP.get(label_str, 5) # Default to NV (most common) if somehow invalid
        
        return {
            'image': image,
            'input_ids': input_ids,
            'attention_mask': attention_mask,
            'label': torch.tensor(label, dtype=torch.long)
        }

def get_splits(csv_path, img_dir, batch_size=32, seed=42):
    """
    Utility function to create train/val/test data loaders with a reproducible split.
    Uses an 70/15/15 split.
    """
    from sklearn.model_selection import train_test_split
    from torch.utils.data import DataLoader
    
    # Read full CSV
    df = pd.read_csv(csv_path)
    df.dropna(subset=['image_id', 'dx'], inplace=True)
    
    # 70% Train, 30% Temp
    train_df, temp_df = train_test_split(df, test_size=0.3, random_state=seed, stratify=df['dx'])
    # 15% Val, 15% Test
    val_df, test_df = train_test_split(temp_df, test_size=0.5, random_state=seed, stratify=temp_df['dx'])
    
    # Save temporary CSVs for the Dataset class to use
    os.makedirs('data/temp_splits', exist_ok=True)
    train_csv = 'data/temp_splits/train.csv'
    val_csv = 'data/temp_splits/val.csv'
    test_csv = 'data/temp_splits/test.csv'
    
    train_df.to_csv(train_csv, index=False)
    val_df.to_csv(val_csv, index=False)
    test_df.to_csv(test_csv, index=False)
    
    # Base transforms
    train_transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    train_dataset = SkinLesionDataset(train_csv, img_dir, is_train=True, transform=train_transform)
    val_dataset = SkinLesionDataset(val_csv, img_dir, is_train=False, transform=val_transform)
    test_dataset = SkinLesionDataset(test_csv, img_dir, is_train=False, transform=val_transform)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=4, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=4, pin_memory=True)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=4, pin_memory=True)
    
    return train_loader, val_loader, test_loader
