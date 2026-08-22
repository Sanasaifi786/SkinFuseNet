import os
import cv2
import numpy as np
import argparse
from pathlib import Path
from tqdm import tqdm

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

def main():
    parser = argparse.ArgumentParser(description="Apply CLAHE to SAM-preprocessed images.")
    # Assuming Person A saves SAM outputs to data/processed/sam
    parser.add_argument("--input_dir", type=str, default=r"..\data\processed\sam", help="Directory containing SAM-processed images")
    parser.add_argument("--output_dir", type=str, default=r"..\data\processed\clahe", help="Directory to save CLAHE-enhanced images")
    parser.add_argument("--clip_limit", type=float, default=2.0)
    
    args = parser.parse_args()
    
    input_path = Path(args.input_dir)
    output_path = Path(args.output_dir)
    
    if not input_path.exists():
        print(f"Error: Input directory {input_path} does not exist.")
        print("Please ensure Person A has completed the SAM batch processing first!")
        return

    # Create output directory if it doesn't exist
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Get all image files
    image_files = list(input_path.glob("*.jpg")) + list(input_path.glob("*.png"))
    
    if len(image_files) == 0:
        print(f"No images found in {input_path}")
        return
        
    print(f"Found {len(image_files)} images. Applying CLAHE...")
    
    # Process with progress bar
    for img_path in tqdm(image_files, desc="Processing Images"):
        # Read image
        img = cv2.imread(str(img_path))
        if img is None:
            continue
            
        # OpenCV loads as BGR, convert to RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Apply CLAHE
        enhanced_rgb = apply_clahe(img_rgb, clip_limit=args.clip_limit)
        
        # Convert back to BGR for saving
        enhanced_bgr = cv2.cvtColor(enhanced_rgb, cv2.COLOR_RGB2BGR)
        
        # Save to output directory
        save_path = output_path / img_path.name
        cv2.imwrite(str(save_path), enhanced_bgr)
        
    print(f"✅ Success! Enhanced images saved to: {output_path}")

if __name__ == "__main__":
    main()
