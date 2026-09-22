"""
Evaluate all SkinFuseNet checkpoints and compute precision, recall, F1, accuracy.
Loads each best_model.pt, runs val set inference, and prints a comparison table.
"""
import sys
from pathlib import Path

ml_dir = Path(__file__).resolve().parents[1]
if str(ml_dir) not in sys.path:
    sys.path.insert(0, str(ml_dir))

import torch
import numpy as np
from torch import autocast
from sklearn.metrics import (
    precision_score, recall_score, f1_score, accuracy_score,
    classification_report
)
from src.dataset import get_splits
from src.model import SkinFuseNetModel
import json

# ── Config ────────────────────────────────────────────────────────────────────
DATA_CFG = {
    "csv_path":  str(ml_dir / "data" / "raw" / "HAM10000_metadata.csv"),
    "img_dir":   str(ml_dir / "data" / "processed"),
    "batch_size": 2,
    "seed":       42,
}

# Checkpoints to evaluate — version name → (checkpoint path, dropout value)
CHECKPOINTS = {
    "V1 Baseline": (ml_dir / "checkpoints" / "best_model.pt", 0.3),
    "V2 LR+Accum": (ml_dir / "checkpoints_v2_batch2_accumulated" / "best_model.pt", 0.3),
    "V3 Sampler":  (ml_dir / "checkpoints_v3_sampler" / "best_model.pt", 0.3),
    "V4 Dropout":  (ml_dir / "checkpoints_v4_dropout_gamma" / "best_model.pt", 0.4),
}

CLASS_NAMES = ["akiec", "bcc", "bkl", "df", "mel", "nv", "vasc"]


@torch.no_grad()
def evaluate_checkpoint(model, loader, device):
    """Run full evaluation and return all predictions + labels."""
    model.eval()
    all_preds = []
    all_labels = []

    for batch_idx, batch in enumerate(loader):
        image          = batch["image"].to(device, non_blocking=True)
        input_ids      = batch["input_ids"].to(device, non_blocking=True)
        attention_mask = batch["attention_mask"].to(device, non_blocking=True)
        labels         = batch["label"].to(device, non_blocking=True)

        with autocast(device_type=device.type, enabled=device.type == "cuda"):
            logits = model(image, input_ids, attention_mask)

        preds = logits.argmax(dim=1).cpu().numpy()
        all_preds.extend(preds)
        all_labels.extend(labels.cpu().numpy())

        if (batch_idx + 1) % 200 == 0:
            print(f"    Batch {batch_idx + 1}/{len(loader)}", flush=True)

    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)

    results = {
        "accuracy":        accuracy_score(all_labels, all_preds),
        "macro_precision": precision_score(all_labels, all_preds, average="macro", zero_division=0),
        "macro_recall":    recall_score(all_labels, all_preds, average="macro", zero_division=0),
        "macro_f1":        f1_score(all_labels, all_preds, average="macro", zero_division=0),
        "weighted_f1":     f1_score(all_labels, all_preds, average="weighted", zero_division=0),
        "per_class":       classification_report(
            all_labels, all_preds, target_names=CLASS_NAMES,
            output_dict=True, zero_division=0
        ),
    }
    return results


def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")
    if device.type == "cuda":
        print(f"GPU: {torch.cuda.get_device_name(0)}")

    # Load data once
    print("\nLoading data...")
    _, val_loader, test_loader = get_splits(
        csv_path=DATA_CFG["csv_path"],
        img_dir=DATA_CFG["img_dir"],
        batch_size=DATA_CFG["batch_size"],
        seed=DATA_CFG["seed"],
        balanced_sampling=False,
    )
    print(f"Val set: {len(val_loader.dataset)} samples")
    print(f"Test set: {len(test_loader.dataset)} samples")

    all_results = {}

    for version_name, (ckpt_path, dropout) in CHECKPOINTS.items():
        print(f"\n{'='*60}")
        print(f"Evaluating: {version_name}")
        print(f"  Checkpoint: {ckpt_path}")

        if not ckpt_path.exists():
            print(f"  SKIPPED — file not found!")
            continue

        # Build model
        model = SkinFuseNetModel(
            num_classes=7, embed_dim=512,
            pretrained=False, freeze_bert=False,
            dropout=dropout,
        ).to(device)

        # Load weights
        ckpt = torch.load(ckpt_path, map_location=device, weights_only=False)
        model.load_state_dict(ckpt["model_state"])
        print(f"  Loaded epoch {ckpt.get('epoch', '?')} (best F1={ckpt.get('best_f1', '?'):.4f})")

        # Evaluate on val set
        print("  Running val evaluation...")
        val_results = evaluate_checkpoint(model, val_loader, device)

        # Evaluate on test set
        print("  Running test evaluation...")
        test_results = evaluate_checkpoint(model, test_loader, device)

        all_results[version_name] = {
            "val": val_results,
            "test": test_results,
            "epoch": ckpt.get("epoch", "?"),
            "dropout": dropout,
        }

        # Print summary
        print(f"\n  VAL  — Acc: {val_results['accuracy']:.4f}  "
              f"P: {val_results['macro_precision']:.4f}  "
              f"R: {val_results['macro_recall']:.4f}  "
              f"F1: {val_results['macro_f1']:.4f}")
        print(f"  TEST — Acc: {test_results['accuracy']:.4f}  "
              f"P: {test_results['macro_precision']:.4f}  "
              f"R: {test_results['macro_recall']:.4f}  "
              f"F1: {test_results['macro_f1']:.4f}")

        # Per-class
        print(f"\n  Per-class (val):")
        print(f"  {'Class':>8s}  {'Prec':>6s}  {'Recall':>6s}  {'F1':>6s}  {'Support':>7s}")
        for cls in CLASS_NAMES:
            c = val_results["per_class"].get(cls, {})
            print(f"  {cls:>8s}  {c.get('precision',0):6.4f}  {c.get('recall',0):6.4f}  "
                  f"{c.get('f1-score',0):6.4f}  {c.get('support',0):7.0f}")

        del model
        torch.cuda.empty_cache() if device.type == "cuda" else None

    # Save results
    output_path = ml_dir / "eval_results.json"
    # Convert numpy types
    def convert(obj):
        if isinstance(obj, (np.integer,)): return int(obj)
        if isinstance(obj, (np.floating,)): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        return obj

    with open(output_path, "w") as f:
        json.dump(all_results, f, indent=2, default=convert)
    print(f"\nResults saved to: {output_path}")

    # Final comparison table
    print("\n" + "=" * 80)
    print("FINAL COMPARISON (Validation Set)")
    print("=" * 80)
    print(f"{'Model':20s} {'Accuracy':>10s} {'Precision':>10s} {'Recall':>10s} {'F1':>10s}")
    print("-" * 62)
    for name, res in all_results.items():
        v = res["val"]
        print(f"{name:20s} {v['accuracy']*100:9.2f}% {v['macro_precision']*100:9.2f}% "
              f"{v['macro_recall']*100:9.2f}% {v['macro_f1']*100:9.2f}%")

    print("\n" + "=" * 80)
    print("FINAL COMPARISON (Test Set)")
    print("=" * 80)
    print(f"{'Model':20s} {'Accuracy':>10s} {'Precision':>10s} {'Recall':>10s} {'F1':>10s}")
    print("-" * 62)
    for name, res in all_results.items():
        t = res["test"]
        print(f"{name:20s} {t['accuracy']*100:9.2f}% {t['macro_precision']*100:9.2f}% "
              f"{t['macro_recall']*100:9.2f}% {t['macro_f1']*100:9.2f}%")


if __name__ == "__main__":
    main()
