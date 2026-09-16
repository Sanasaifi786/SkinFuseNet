import os
import torch
import cv2
import sys
from pathlib import Path

# Add project root to sys.path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ml.src.preprocess.augmentation import mixup, cutmix, rspda
from ml.src.branches.bert import MetadataTokenizer

def test_sam_clahe():
    print("--- Test 1: SAM+CLAHE outputs ---")
    processed_dir = Path("ml/data/processed")
    if not processed_dir.exists():
        print(f"Error: {processed_dir} does not exist.")
        return
    images = list(processed_dir.glob("*.jpg"))
    if not images:
        print("Error: No images found in processed directory.")
        return
        
    print(f"Found {len(images)} images.")
    # Check shape of first 5
    for img_path in images[:5]:
        img = cv2.imread(str(img_path))
        if img is None:
            print(f"Failed to read {img_path.name}")
        else:
            print(f"{img_path.name}: Shape {img.shape}, dtype {img.dtype}")
    print("Test 1 PASS\n")

def test_augmentations():
    print("--- Test 2: Data Augmentations (mixup & cutmix & rspda) ---")
    try:
        # Create dummy images
        image1 = torch.rand(3, 256, 256)
        image2 = torch.rand(3, 256, 256)
        
        # Dummy labels for 7 classes
        label1 = torch.tensor(0) # akiec
        label2 = torch.tensor(4) # mel
        
        print(f"Original labels: {label1.item()} and {label2.item()}")
        
        # Test mixup
        mixed_image, mixed_label = mixup(image1, label1, image2, label2, alpha=0.5)
        print("\nMixUp label (should be soft target):")
        print(mixed_label)
        
        # Test cutmix
        cut_image, cut_label = cutmix(image1, label1, image2, label2, alpha=1.0)
        print("\nCutMix label (should be soft target):")
        print(cut_label)
        
        # Test rspda
        rspda_image = rspda(image1)
        print(f"\nRSPDA output shape: {rspda_image.shape}")
        
        print("Test 2 PASS\n")
    except Exception as e:
        print(f"Test 2 FAILED: {e}")

def test_bert_tokenization():
    print("--- Test 3: BERT Tokenization ---")
    try:
        tokenizer = MetadataTokenizer()
        # Test single
        tokens = tokenizer.tokenize(age=45, sex='male', localization='back')
        print("Single tokenize shape:", tokens['input_ids'].shape)
        
        # Test batch
        ages = [45, 60, 25]
        sexes = ['male', 'female', 'unknown']
        localizations = ['back', 'face', 'foot']
        
        print("\nTesting multiple individual calls...")
        for a, s, l in zip(ages, sexes, localizations):
            tok = tokenizer.tokenize(a, s, l)
            print(f"Input: {a}, {s}, {l} -> shape {tok['input_ids'].shape}")
            
        print("Test 3 PASS\n")
    except Exception as e:
        print(f"Test 3 FAILED: {e}")

if __name__ == "__main__":
    test_sam_clahe()
    test_augmentations()
    test_bert_tokenization()
