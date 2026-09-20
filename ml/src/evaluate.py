import os
import json
import torch
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    roc_curve,
    balanced_accuracy_score
)
from torch.utils.data import DataLoader

CLASS_NAMES = ['AKIEC', 'BCC', 'BKL', 'DF', 'MEL', 'NV', 'VASC']

def evaluate_model(model, dataloader, device, output_dir="ml/reports"):
    """
    Evaluates SkinFuseNet on a test/validation dataloader and generates 
    medical metric reports, confusion matrices, and ROC-AUC curves.
    """
    os.makedirs(output_dir, exist_ok=True)
    model.eval()
    model.to(device)

    all_preds = []
    all_targets = []
    all_probs = []

    print(f"📊 Running evaluation on {len(dataloader.dataset)} samples...")

    with torch.no_grad():
        for batch in dataloader:
            # Check if batch contains (images, metadata, targets)
            if len(batch) == 3:
                images, metadata, targets = batch
                images = images.to(device)
                metadata = metadata.to(device)
                logits = model(images, metadata)
            else:
                images, targets = batch
                images = images.to(device)
                logits = model(images)

            probs = torch.softmax(logits, dim=1)
            preds = torch.argmax(probs, dim=1)

            all_preds.extend(preds.cpu().numpy())
            all_targets.extend(targets.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())

    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)
    all_probs = np.array(all_probs)

    # 1. Calculate Primary Metrics
    acc = (all_preds == all_targets).mean()
    balanced_acc = balanced_accuracy_score(all_targets, all_preds)
    
    # 2. Multi-class ROC-AUC (One-vs-Rest)
    try:
        auc_ovr = roc_auc_score(all_targets, all_probs, multi_class="ovr", average="macro")
    except Exception as e:
        auc_ovr = float("nan")
        print(f"⚠️ Could not compute multi-class ROC-AUC: {e}")

    # 3. Detailed Per-Class Classification Report
    report_dict = classification_report(
        all_targets,
        all_preds,
        target_names=CLASS_NAMES,
        output_dict=True,
        zero_division=0
    )

    metrics_summary = {
        "overall_accuracy": round(float(acc), 4),
        "balanced_accuracy": round(float(balanced_acc), 4),
        "macro_roc_auc_ovr": round(float(auc_ovr), 4) if not np.isnan(auc_ovr) else None,
        "per_class_metrics": report_dict
    }

    # Save metrics JSON
    metrics_path = os.path.join(output_dir, "evaluation_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics_summary, f, indent=4)
    print(f"✅ Saved metrics to {metrics_path}")

    # 4. Plot & Save Confusion Matrix
    cm = confusion_matrix(all_targets, all_preds, normalize="true")
    plt.figure(figsize=(9, 7))
    sns.heatmap(
        cm,
        annot=True,
        fmt=".2f",
        cmap="Blues",
        xticklabels=CLASS_NAMES,
        yticklabels=CLASS_NAMES,
        cbar=True
    )
    plt.title("SkinFuseNet Normalized Confusion Matrix", fontsize=14, pad=12)
    plt.xlabel("Predicted Label", fontsize=12)
    plt.ylabel("Ground Truth Label", fontsize=12)
    plt.tight_layout()
    cm_path = os.path.join(output_dir, "confusion_matrix.png")
    plt.savefig(cm_path, dpi=300)
    plt.close()
    print(f"✅ Saved Confusion Matrix to {cm_path}")

    # 5. Plot & Save One-vs-Rest ROC Curves
    plt.figure(figsize=(9, 7))
    for i, class_name in enumerate(CLASS_NAMES):
        binary_targets = (all_targets == i).astype(int)
        class_probs = all_probs[:, i]
        if len(np.unique(binary_targets)) > 1:
            fpr, tpr, _ = roc_curve(binary_targets, class_probs)
            class_auc = roc_auc_score(binary_targets, class_probs)
            plt.plot(fpr, tpr, label=f"{class_name} (AUC = {class_auc:.2f})")

    plt.plot([0, 1], [0, 1], "k--", alpha=0.6, label="Random Guess (AUC = 0.50)")
    plt.title("Multi-Class ROC-AUC Curves (One-vs-Rest)", fontsize=14, pad=12)
    plt.xlabel("False Positive Rate (1 - Specificity)", fontsize=12)
    plt.ylabel("True Positive Rate (Sensitivity)", fontsize=12)
    plt.legend(loc="lower right", fontsize=10)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    roc_path = os.path.join(output_dir, "roc_curves.png")
    plt.savefig(roc_path, dpi=300)
    plt.close()
    print(f"✅ Saved ROC Curves to {roc_path}")

    print("\n" + "="*50)
    print(f"🎯 Test Accuracy:     {acc * 100:.2f}%")
    print(f"⚖️ Balanced Accuracy: {balanced_acc * 100:.2f}%")
    print(f"📈 Macro ROC-AUC:     {auc_ovr:.4f}")
    print("="*50)

    return metrics_summary

if __name__ == "__main__":
    print("Run `python ml/src/evaluate.py` with your test DataLoader to generate complete reports.")
