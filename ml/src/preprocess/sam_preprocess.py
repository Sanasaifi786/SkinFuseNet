import os
import cv2
import torch
import numpy as np
import argparse
from pathlib import Path
from tqdm import tqdm
from segment_anything import sam_model_registry, SamPredictor

def generate_mask(predictor, image, bbox=None):
    """
    Generates a segmentation mask using SAM.
    If bbox is not provided, it uses a central crop heuristic as the prompt.
    """
    predictor.set_image(image)
    
    if bbox is None:
        # Default prompt: a bounding box in the center 60% of the image.
        h, w = image.shape[:2]
        x1, y1 = int(w * 0.2), int(h * 0.2)
        x2, y2 = int(w * 0.8), int(h * 0.8)
        input_box = np.array([x1, y1, x2, y2])
    else:
        input_box = np.array(bbox)
        
    masks, scores, _ = predictor.predict(
        point_coords=None,
        point_labels=None,
        box=input_box[None, :],
        multimask_output=False,
    )
    
    # Return the best mask and its score
    return masks[0], scores[0]

def apply_mask(image, mask):
    """
    Applies a boolean mask to the image, turning the background black.
    """
    masked_image = np.zeros_like(image)
    masked_image[mask] = image[mask]
    return masked_image

def main():
    parser = argparse.ArgumentParser(description="Process HAM10000 images with SAM to segment lesions.")
    # Paths are relative to where the script is run (typically from ml folder)
    parser.add_argument("--input_dir", type=str, default=r"data\raw\HAM10000_images_part_1", help="Raw images directory")
    parser.add_argument("--output_dir", type=str, default=r"data\processed\sam", help="Directory to save masked images")
    parser.add_argument("--checkpoint", type=str, default=r"checkpoints\sam_vit_b.pth", help="Path to SAM checkpoint")
    parser.add_argument("--model_type", type=str, default="vit_b", help="SAM model type (vit_h, vit_l, vit_b)")
    parser.add_argument("--device", type=str, default=None, help="Device to run on (cuda or cpu)")
    
    args = parser.parse_args()
    
    # Get absolute path relative to ml directory
    # Assuming script is run from SkinFuseNet/ml directory:
    base_dir = Path(__file__).parent.parent.parent
    input_path = base_dir / args.input_dir
    output_path = base_dir / args.output_dir
    checkpoint_path = base_dir / args.checkpoint
    
    if not input_path.exists():
        print(f"Error: Input directory {input_path} does not exist.")
        return
        
    if not checkpoint_path.exists():
        print(f"Error: SAM checkpoint not found at {checkpoint_path}. Please download it first.")
        return

    output_path.mkdir(parents=True, exist_ok=True)
    
    # Determine device
    if args.device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    else:
        device = args.device
        
    print(f"Loading SAM model ({args.model_type}) on {device}...")
    sam = sam_model_registry[args.model_type](checkpoint=str(checkpoint_path))
    sam.to(device=device)
    predictor = SamPredictor(sam)
    print("SAM model loaded successfully.")
    
    image_files = list(input_path.glob("*.jpg")) + list(input_path.glob("*.png"))
    
    if len(image_files) == 0:
        print(f"No images found in {input_path}")
        return
        
    print(f"Found {len(image_files)} images. Starting segmentation...")
    
    log_file = output_path / "sam_failures.log"
    failures = 0
    
    with open(log_file, "w") as log:
        for img_path in tqdm(image_files, desc="Processing Images"):
            img = cv2.imread(str(img_path))
            if img is None:
                log.write(f"{img_path.name}: Failed to read image file.\n")
                continue
                
            # OpenCV loads as BGR, convert to RGB for SAM
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            try:
                # Generate mask
                mask, score = generate_mask(predictor, img_rgb)
                
                if score < 0.5:
                    # Low confidence fallback: use original image
                    log.write(f"{img_path.name}: Low confidence score ({score:.2f}). Used fallback.\n")
                    failures += 1
                    enhanced_bgr = img # Fallback to original
                else:
                    # Apply mask and convert back to BGR for saving
                    masked_rgb = apply_mask(img_rgb, mask)
                    enhanced_bgr = cv2.cvtColor(masked_rgb, cv2.COLOR_RGB2BGR)
                    
            except Exception as e:
                log.write(f"{img_path.name}: Exception during SAM - {str(e)}. Used fallback.\n")
                failures += 1
                enhanced_bgr = img # Fallback to original
            
            # Save to output directory
            save_path = output_path / img_path.name
            cv2.imwrite(str(save_path), enhanced_bgr)
            
    print(f"✅ Success! Masked images saved to: {output_path}")
    print(f"Failed/Fallback segmentations: {failures}/{len(image_files)}")
    print(f"See {log_file} for details on failures.")

if __name__ == "__main__":
    main()
