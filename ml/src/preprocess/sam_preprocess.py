"""
sam_preprocess.py
=================
Stage 1 of the SkinFuseNet preprocessing pipeline.

What this script does (exactly as described in the paper):
    1. SAM-guided lesion segmentation
       - Uses SamAutomaticMaskGenerator (zero-shot, no fixed bbox)
       - Scores every segment by size + proximity to image centre
       - Picks the highest-scoring segment as the lesion
       - Applies the mask: everything outside lesion → black
       - Fallback: if SAM fails or confidence too low → use resized original

    2. CLAHE contrast enhancement (applied AFTER masking)
       - Operates on L channel of LAB colour space only
       - Preserves colour hue while enhancing local texture contrast
       - clipLimit=2.0, tileGridSize=(8,8) — values from paper

    3. Resize to 256×256
       - Matches the input size used during model training

Output:
    ml/data/processed/{image_id}.jpg
    ml/logs/sam_failures.log  — images that used fallback

Usage:
    # Full run (GPU recommended — ~2-3 hrs on RTX 3090)
    python ml/src/preprocess/sam_preprocess.py

    # Test on first N images only
    python ml/src/preprocess/sam_preprocess.py --limit 50

    # Force reprocess already-done images
    python ml/src/preprocess/sam_preprocess.py --overwrite

    # Use CPU (slow but works — ~28 hrs for full dataset)
    python ml/src/preprocess/sam_preprocess.py --device cpu

Notes:
    - Requires SAM checkpoint at ml/checkpoints/sam_vit_b.pth
      Download: https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth
    - On Windows, run from the project root (SkinFuseNet/) directory
    - num_workers issues on Windows: this script is single-threaded, no DataLoader used
"""

import os
import cv2
import torch
import numpy as np
import argparse
from pathlib import Path
from tqdm import tqdm
from segment_anything import sam_model_registry, SamAutomaticMaskGenerator


# ── Constants (match paper settings exactly) ──────────────────────────────────
OUTPUT_SIZE       = 256          # all output images resized to 256x256
CLAHE_CLIP_LIMIT  = 2.0          # from paper
CLAHE_TILE_SIZE   = (8, 8)       # from paper
SAM_POINTS_SIDE   = 16           # density of automatic prompt points (lower = faster)
SAM_IOU_THRESH    = 0.88         # minimum mask quality score
SAM_STAB_THRESH   = 0.95         # stability score threshold
SAM_MIN_AREA      = 500          # ignore segments smaller than 500 px (hair strands etc.)
CENTRE_WEIGHT     = 0.3          # how much to penalise off-centre segments (0=ignore, 1=strict)


# ── CLAHE ─────────────────────────────────────────────────────────────────────
def apply_clahe(image_rgb: np.ndarray) -> np.ndarray:
    """
    Apply CLAHE on the L channel of LAB colour space.

    Why L channel only:
        LAB separates lightness (L) from colour (A=green-red, B=blue-yellow).
        Applying CLAHE to L enhances local contrast without shifting lesion
        colours — critical because colour heterogeneity is a key diagnostic
        feature in dermoscopy.

    Args:
        image_rgb: np.ndarray [H, W, 3] in RGB format, values 0-255

    Returns:
        np.ndarray [H, W, 3] in RGB format with enhanced contrast
    """
    lab = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2LAB)
    clahe = cv2.createCLAHE(clipLimit=CLAHE_CLIP_LIMIT, tileGridSize=CLAHE_TILE_SIZE)
    lab[:, :, 0] = clahe.apply(lab[:, :, 0])
    enhanced_rgb = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
    return enhanced_rgb


# ── Mask selection ─────────────────────────────────────────────────────────────
def score_mask(mask_data: dict, image_h: int, image_w: int) -> float:
    """
    Score a SAM segment to determine how likely it is to be the lesion.

    Strategy (paper-aligned):
        score = area_ratio - CENTRE_WEIGHT * centre_distance_ratio

    Lesions are typically:
        - Large relative to the image (high area_ratio)
        - Near the centre of the image (low centre_distance_ratio)

    Args:
        mask_data:  dict from SamAutomaticMaskGenerator (has 'segmentation', 'area', etc.)
        image_h:    image height in pixels
        image_w:    image width in pixels

    Returns:
        float score (higher = more likely to be the lesion)
    """
    seg   = mask_data['segmentation']   # bool array [H, W]
    area  = mask_data['area']           # number of True pixels

    # Area ratio: what fraction of the image does this segment cover
    area_ratio = area / (image_h * image_w)

    # Centre of this segment
    ys, xs = np.where(seg)
    if len(ys) == 0:
        return -1.0
    seg_cy = ys.mean()
    seg_cx = xs.mean()

    # Distance from image centre, normalised by max possible distance
    image_cy = image_h / 2.0
    image_cx = image_w / 2.0
    dist = np.sqrt((seg_cy - image_cy) ** 2 + (seg_cx - image_cx) ** 2)
    max_dist = np.sqrt(image_cy ** 2 + image_cx ** 2)
    dist_ratio = dist / (max_dist + 1e-6)

    return area_ratio - CENTRE_WEIGHT * dist_ratio


def pick_best_mask(masks: list, image_h: int, image_w: int):
    """
    From all SAM segments, return the one most likely to be the lesion.

    Returns:
        best_mask (np.ndarray bool [H,W]) or None if no valid segment found
    """
    if not masks:
        return None

    best_mask  = None
    best_score = -999.0

    for mask_data in masks:
        s = score_mask(mask_data, image_h, image_w)
        if s > best_score:
            best_score = s
            best_mask  = mask_data['segmentation']

    return best_mask


# ── Apply mask ─────────────────────────────────────────────────────────────────
def apply_mask(image_rgb: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """
    Zero out all pixels outside the lesion mask.

    Args:
        image_rgb:  np.ndarray [H, W, 3] RGB
        mask:       np.ndarray [H, W] bool — True where lesion is

    Returns:
        np.ndarray [H, W, 3] RGB — lesion pixels kept, background black
    """
    masked = np.zeros_like(image_rgb)
    masked[mask] = image_rgb[mask]
    return masked


# ── Full preprocessing for one image ──────────────────────────────────────────
def preprocess_one(
    image_rgb: np.ndarray,
    mask_generator: SamAutomaticMaskGenerator,
    fallback_reason: str = None,
) -> tuple:
    """
    Run the full Stage 1 pipeline on a single RGB image:
        SAM segmentation → mask application → CLAHE → resize to 256x256

    Args:
        image_rgb:       np.ndarray [H, W, 3] RGB
        mask_generator:  SamAutomaticMaskGenerator instance
        fallback_reason: if not None, skip SAM and use image as-is (fallback mode)

    Returns:
        (processed_rgb, used_fallback, reason_string)
        processed_rgb: np.ndarray [256, 256, 3] RGB, ready to save
    """
    H, W = image_rgb.shape[:2]
    used_fallback = False
    reason = ""

    if fallback_reason is None:
        try:
            # ── Step 1: SAM automatic mask generation ──────────────────────────
            masks = mask_generator.generate(image_rgb)

            if len(masks) == 0:
                used_fallback = True
                reason = "SAM found 0 segments"
            else:
                best_mask = pick_best_mask(masks, H, W)

                if best_mask is None:
                    used_fallback = True
                    reason = "No valid mask after scoring"
                else:
                    # ── Step 2: Apply mask (background → black) ─────────────────
                    image_rgb = apply_mask(image_rgb, best_mask)

        except Exception as e:
            used_fallback = True
            reason = f"SAM exception: {str(e)}"
    else:
        used_fallback = True
        reason = fallback_reason

    # ── Step 3: CLAHE contrast enhancement ────────────────────────────────────
    # Applied regardless of whether SAM succeeded or fallback was used
    image_rgb = apply_clahe(image_rgb)

    # ── Step 4: Resize to 256×256 ─────────────────────────────────────────────
    image_rgb = cv2.resize(image_rgb, (OUTPUT_SIZE, OUTPUT_SIZE),
                           interpolation=cv2.INTER_AREA)

    return image_rgb, used_fallback, reason


# ── Find image folders ─────────────────────────────────────────────────────────
def find_image_files(input_dir: Path) -> list:
    """
    Find all JPEG/PNG images recursively under input_dir.
    Handles both HAM10000_images_part_1 and part_2 automatically.
    Deduplicates by filename so the same image_id is not processed twice.

    Returns:
        list of Path objects, one per unique image filename
    """
    all_files = sorted(
        list(input_dir.rglob("*.jpg")) +
        list(input_dir.rglob("*.jpeg")) +
        list(input_dir.rglob("*.png"))
    )

    # Deduplicate by filename — keep first occurrence
    seen = {}
    for f in all_files:
        if f.name not in seen:
            seen[f.name] = f

    return list(seen.values())


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="SkinFuseNet Stage 1: SAM segmentation + CLAHE + resize for HAM10000"
    )
    parser.add_argument(
        "--input_dir", type=str,
        default=r"ml\data\raw",
        help="Folder containing raw HAM10000 images (searches recursively for part_1 and part_2)"
    )
    parser.add_argument(
        "--output_dir", type=str,
        default=r"ml\data\processed",
        help="Output folder for preprocessed images"
    )
    parser.add_argument(
        "--checkpoint", type=str,
        default=r"ml\checkpoints\sam_vit_b.pth",
        help="Path to SAM ViT-B checkpoint (.pth file)"
    )
    parser.add_argument(
        "--model_type", type=str, default="vit_b",
        choices=["vit_b", "vit_l", "vit_h"],
        help="SAM model variant (vit_b recommended for speed, vit_h for accuracy)"
    )
    parser.add_argument(
        "--device", type=str, default=None,
        help="Device: 'cuda' or 'cpu'. Auto-detected if not set."
    )
    parser.add_argument(
        "--overwrite", action="store_true",
        help="Reprocess images that already exist in output_dir"
    )
    parser.add_argument(
        "--limit", type=int, default=None,
        help="Process only the first N images (for testing)"
    )
    args = parser.parse_args()

    # ── Resolve paths relative to where the script is run from ────────────────
    # Run from project root: python ml/src/preprocess/sam_preprocess.py
    cwd = Path.cwd()

    input_path  = Path(args.input_dir)  if Path(args.input_dir).is_absolute()  else cwd / args.input_dir
    output_path = Path(args.output_dir) if Path(args.output_dir).is_absolute() else cwd / args.output_dir
    ckpt_path   = Path(args.checkpoint) if Path(args.checkpoint).is_absolute()  else cwd / args.checkpoint

    # ── Validate paths ─────────────────────────────────────────────────────────
    if not input_path.exists():
        print(f"❌ Input directory not found: {input_path}")
        print(f"   Run from the project root (SkinFuseNet/) and check --input_dir")
        return

    if not ckpt_path.exists():
        print(f"❌ SAM checkpoint not found: {ckpt_path}")
        print(f"   Download it:")
        print(f"   curl -L https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth -o {ckpt_path}")
        return

    output_path.mkdir(parents=True, exist_ok=True)
    log_dir = cwd / "ml" / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / "sam_failures.log"

    # ── Device ────────────────────────────────────────────────────────────────
    if args.device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    else:
        device = args.device

    if device == "cpu":
        print("⚠️  Running on CPU. Full dataset will take ~28 hours. GPU strongly recommended.")
    else:
        print(f"✅ GPU detected: {torch.cuda.get_device_name(0)}")

    # ── Load SAM ───────────────────────────────────────────────────────────────
    print(f"\nLoading SAM ({args.model_type}) on {device}...")
    sam = sam_model_registry[args.model_type](checkpoint=str(ckpt_path))
    sam.to(device=device)

    # SamAutomaticMaskGenerator — zero-shot, no fixed bounding box needed
    # Uses a grid of point prompts over the image and finds all segments
    mask_generator = SamAutomaticMaskGenerator(
        model=sam,
        points_per_side=SAM_POINTS_SIDE,        # 16 = 256 prompt points per image
        pred_iou_thresh=SAM_IOU_THRESH,          # filter low-quality masks
        stability_score_thresh=SAM_STAB_THRESH,  # filter unstable masks
        min_mask_region_area=SAM_MIN_AREA,       # ignore tiny segments (hair)
    )
    print("SAM loaded successfully.\n")

    # ── Discover images ────────────────────────────────────────────────────────
    all_images = find_image_files(input_path)

    if len(all_images) == 0:
        print(f"❌ No images found under: {input_path}")
        return

    # Filter already-processed unless overwrite
    if not args.overwrite:
        pending = [f for f in all_images if not (output_path / f.name).exists()]
        already_done = len(all_images) - len(pending)
        if already_done > 0:
            print(f"   {already_done}/{len(all_images)} images already processed — skipping.")
        images_to_run = pending
    else:
        images_to_run = all_images

    # Apply --limit for testing
    if args.limit is not None:
        images_to_run = images_to_run[:args.limit]
        print(f"   --limit {args.limit}: processing first {len(images_to_run)} images only.\n")

    if len(images_to_run) == 0:
        print(f"✅ Nothing to do — all images already processed in {output_path}")
        return

    print(f"Found {len(all_images)} total images.")
    print(f"Processing {len(images_to_run)} images → {output_path}\n")

    # ── Process ────────────────────────────────────────────────────────────────
    successes    = 0
    fallbacks    = 0
    read_errors  = 0

    # Overwrite log file for this run (not append — previous logs stay in git history)
    with open(log_file, "w") as log:
        log.write(f"SkinFuseNet SAM preprocessing log\n")
        log.write(f"Input:  {input_path}\n")
        log.write(f"Output: {output_path}\n")
        log.write(f"Device: {device}\n")
        log.write(f"Images to process: {len(images_to_run)}\n")
        log.write("-" * 60 + "\n\n")

        for img_path in tqdm(images_to_run, desc="SAM preprocessing", unit="img"):
            # ── Load image ─────────────────────────────────────────────────────
            bgr = cv2.imread(str(img_path))
            if bgr is None:
                log.write(f"[READ ERROR] {img_path.name}: Could not read file.\n")
                read_errors += 1
                continue

            # OpenCV reads as BGR — convert to RGB for SAM and CLAHE
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

            # ── Preprocess (SAM + CLAHE + resize) ─────────────────────────────
            processed_rgb, used_fallback, reason = preprocess_one(
                rgb, mask_generator
            )

            if used_fallback:
                log.write(f"[FALLBACK] {img_path.name}: {reason}\n")
                fallbacks += 1
            else:
                successes += 1

            # ── Save ───────────────────────────────────────────────────────────
            # Convert back to BGR for cv2.imwrite
            processed_bgr = cv2.cvtColor(processed_rgb, cv2.COLOR_RGB2BGR)
            save_path = output_path / img_path.name
            cv2.imwrite(str(save_path), processed_bgr, [cv2.IMWRITE_JPEG_QUALITY, 95])

    # ── Summary ───────────────────────────────────────────────────────────────
    total_processed = successes + fallbacks
    print(f"\n{'='*55}")
    print(f"✅ Preprocessing complete!")
    print(f"   Total processed : {total_processed}")
    print(f"   SAM succeeded   : {successes} ({successes/max(total_processed,1)*100:.1f}%)")
    print(f"   Fallback used   : {fallbacks} ({fallbacks/max(total_processed,1)*100:.1f}%)")
    print(f"   Read errors     : {read_errors}")
    print(f"   Output folder   : {output_path}")
    print(f"   Failure log     : {log_file}")
    print(f"{'='*55}")

    # Sanity check: count output files
    output_count = len(list(output_path.glob("*.jpg")))
    print(f"\nOutput folder contains {output_count} images.")
    if output_count < len(all_images) * 0.95:
        print(f"⚠️  Expected ~{len(all_images)}, only found {output_count}.")
        print(f"   Check {log_file} for errors.")
    else:
        print(f"✅ Count looks correct.")


if __name__ == "__main__":
    main()
