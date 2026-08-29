import os
import sys
import torch
import argparse
from pathlib import Path

# Add ml folder to path so we can import src
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.dataset import get_splits

def main():
    parser = argparse.ArgumentParser(description="Verify SkinLesionDataset loading and tensor shapes.")
    parser.add_argument("--csv", type=str, required=True, help="Path to HAM10000 metadata CSV")
    parser.add_argument("--img_dir", type=str, required=True, help="Path to processed images directory (e.g. CLAHE outputs)")
    args = parser.parse_args()
    
    csv_path = Path(args.csv)
    img_dir = Path(args.img_dir)
    
    if not csv_path.exists():
        print(f"FAIL: CSV file not found at {csv_path}")
        return
        
    if not img_dir.exists():
        print(f"FAIL: Image directory not found at {img_dir}")
        return
        
    print(f"Testing dataset splits using CSV: {csv_path} and Images: {img_dir}...")
    
    try:
        train_loader, val_loader, test_loader = get_splits(csv_path, img_dir, batch_size=4)
        
        print(f"Success: Created DataLoaders. Train batches: {len(train_loader)}, Val batches: {len(val_loader)}, Test batches: {len(test_loader)}")
        
        # Test a single batch from train_loader
        print("\nFetching a single batch from train_loader...")
        batch = next(iter(train_loader))
        
        images = batch['image']
        input_ids = batch['input_ids']
        attention_mask = batch['attention_mask']
        labels = batch['label']
        
        print(f"Images shape:         {images.shape} (Expected: [4, 3, 256, 256])")
        print(f"Images dtype:         {images.dtype}")
        print(f"Images min/max:       {images.min():.2f} / {images.max():.2f}")
        
        print(f"\nInput IDs shape:      {input_ids.shape} (Expected: [4, 128])")
        print(f"Input IDs dtype:      {input_ids.dtype}")
        
        print(f"\nAttention Mask shape: {attention_mask.shape} (Expected: [4, 128])")
        print(f"Attention Mask dtype: {attention_mask.dtype}")
        
        print(f"\nLabels shape:         {labels.shape} (Expected: [4])")
        print(f"Labels dtype:         {labels.dtype}")
        print(f"Labels values:        {labels.tolist()}")
        
        print("\n✅ Verification PASSED.")
        
    except Exception as e:
        print(f"\n❌ Verification FAILED: {str(e)}")

if __name__ == "__main__":
    main()
