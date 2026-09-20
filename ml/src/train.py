import sys
from pathlib import Path

# ── sys.path fix MUST come before any src.* imports ──────────────────────────
ml_dir = Path(__file__).resolve().parents[1]
if str(ml_dir) not in sys.path:
    sys.path.insert(0, str(ml_dir))

import os
import time
import torch
import torch.nn as nn
import numpy as np
from torch import autocast                   # imported from torch instead of torch.cuda.amp
from torch.optim import AdamW
from torch.optim.lr_scheduler import (
    CosineAnnealingLR, LinearLR, SequentialLR
)
from sklearn.metrics import f1_score, accuracy_score

# ── Config ────────────────────────────────────────────────────────────────────
CONFIG = {
    # Paths — anchored to ml/ directory so script works from any CWD
    "csv_path":      str(ml_dir / "data" / "raw" / "HAM10000_metadata.csv"),
    "img_dir":       str(ml_dir / "data" / "processed"),
    "checkpoint_dir": str(ml_dir / "checkpoints_v3_sampler"),

    # Model
    "num_classes":   7,
    "embed_dim":     512,
    "pretrained":    True,
    "freeze_bert":   True,
    "bert_unfreeze_epoch": 20,  # delay BERT fine-tuning until image branches stabilize

    # Training
    "batch_size":    2,
    "gradient_accumulation_steps": 4,
    "epochs":        100,
    "max_train_batches": None,
    "max_eval_batches":  None,
    "balanced_sampling": True,
    "resume":        True,
    "lr":            5e-5,
    "weight_decay":  1e-2,       # paper: 1e-2  (original code had 1e-4 — corrected)
    "warmup_epochs": 10,         # linear LR warmup before cosine annealing
    "early_stop_patience": 15,   # stop if val macro F1 does not improve for 15 epochs

    # Loss
    "focal_gamma":        2.0,
    "label_smoothing":    0.1,

    # Misc
    "seed":          42,
    "wandb_project": "skinfusenet",
    "wandb_run":     "run_v3_sampler",
}


# ── Helpers ───────────────────────────────────────────────────────────────────
def set_seed(seed: int):
    torch.random.default_generator.manual_seed(seed)
    np.random.seed(seed)


def save_checkpoint(
    path, model, optimizer, scheduler, scaler, epoch, best_f1,
    patience_counter, config
):
    """
    Saves full training state so training can be resumed from a checkpoint.
    Saves:
        model weights, optimizer state, scheduler state,
        epoch number, best val F1, and config dict.
    """
    torch.save({
        "epoch":           epoch,
        "model_state":     model.state_dict(),
        "optimizer_state": optimizer.state_dict(),
        "scheduler_state": scheduler.state_dict(),
        "scaler_state":    scaler.state_dict(),
        "best_f1":         best_f1,
        "patience_counter": patience_counter,
        "config":          config,
    }, path)


def load_checkpoint(path, model, optimizer, scheduler, scaler):
    """Load full training state and return epoch, best F1, and patience."""
    ckpt      = torch.load(path, map_location="cpu")
    model.load_state_dict(ckpt["model_state"])
    optimizer.load_state_dict(ckpt["optimizer_state"])
    scheduler.load_state_dict(ckpt["scheduler_state"])
    if "scaler_state" in ckpt:
        scaler.load_state_dict(ckpt["scaler_state"])
    return (
        ckpt["epoch"],
        ckpt["best_f1"],
        ckpt.get("patience_counter", 0),
        ckpt.get("config", {}),
    )


# ── Training ──────────────────────────────────────────────────────────────────
def train_one_epoch(
    model, loader, optimizer, criterion, scaler, device,
    accumulation_steps=1, max_batches=None
):
    """
    Runs one full training epoch.
    Returns: dict with 'loss', 'accuracy', 'macro_f1'
    """
    model.train()
    total_loss = 0.0
    all_preds  = []
    all_labels = []

    processed_batches = 0
    optimizer.zero_grad(set_to_none=True)
    for batch_index, batch in enumerate(loader):
        if max_batches is not None and batch_index >= max_batches:
            break
        image          = batch["image"].to(device, non_blocking=True)
        input_ids      = batch["input_ids"].to(device, non_blocking=True)
        attention_mask = batch["attention_mask"].to(device, non_blocking=True)
        labels         = batch["label"].to(device, non_blocking=True)

        # autocast requires device_type in PyTorch 2.x
        # torch.cuda.amp.autocast() with no args is deprecated — use this form
        with autocast(device_type=device.type, enabled=device.type == "cuda"):
            logits = model(image, input_ids, attention_mask)
            loss   = criterion(logits, labels)

        scaler.scale(loss / accumulation_steps).backward()
        is_accumulation_step = (batch_index + 1) % accumulation_steps == 0
        is_last_batch = (
            batch_index + 1 == len(loader)
            or (
                max_batches is not None
                and batch_index + 1 == max_batches
            )
        )
        if is_accumulation_step or is_last_batch:
            scaler.step(optimizer)
            scaler.update()
            optimizer.zero_grad(set_to_none=True)

        total_loss += loss.item()
        preds       = logits.argmax(dim=1).cpu().numpy()
        all_preds.extend(preds)
        all_labels.extend(labels.cpu().numpy())
        processed_batches += 1

        if (batch_index + 1) % 500 == 0:
            print(
                f"  Train batch {batch_index + 1}/{len(loader)}",
                flush=True,
            )

    n       = max(1, processed_batches)
    acc     = accuracy_score(all_labels, all_preds)
    macro_f1 = f1_score(all_labels, all_preds, average="macro", zero_division=0)

    return {
        "loss":      total_loss / n,
        "accuracy":  acc,
        "macro_f1":  macro_f1,
    }


@torch.no_grad()
def evaluate(model, loader, criterion, device, max_batches=None):
    """
    Runs evaluation on val or test set.
    Returns: dict with 'loss', 'accuracy', 'macro_f1'
    """
    model.eval()
    total_loss = 0.0
    all_preds  = []
    all_labels = []

    processed_batches = 0
    for batch_index, batch in enumerate(loader):
        if max_batches is not None and batch_index >= max_batches:
            break
        image          = batch["image"].to(device, non_blocking=True)
        input_ids      = batch["input_ids"].to(device, non_blocking=True)
        attention_mask = batch["attention_mask"].to(device, non_blocking=True)
        labels         = batch["label"].to(device, non_blocking=True)

        with autocast(device_type=device.type, enabled=device.type == "cuda"):
            logits = model(image, input_ids, attention_mask)
            loss   = criterion(logits, labels)

        total_loss += loss.item()
        preds       = logits.argmax(dim=1).cpu().numpy()
        all_preds.extend(preds)
        all_labels.extend(labels.cpu().numpy())
        processed_batches += 1

        if (batch_index + 1) % 500 == 0:
            print(
                f"  Eval batch {batch_index + 1}/{len(loader)}",
                flush=True,
            )

    n        = max(1, processed_batches)
    acc      = accuracy_score(all_labels, all_preds)
    macro_f1 = f1_score(all_labels, all_preds, average="macro", zero_division=0)

    return {
        "loss":      total_loss / n,
        "accuracy":  acc,
        "macro_f1":  macro_f1,
    }


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    cfg    = CONFIG

    from src.dataset import get_splits
    from src.loss import FocalLoss

    # ── Data ──────────────────────────────────────────────────────────────────
    print("Loading data...")
    train_loader, val_loader, test_loader = get_splits(
        csv_path=cfg["csv_path"],
        img_dir=cfg["img_dir"],
        batch_size=cfg["batch_size"],
        seed=cfg["seed"],
        balanced_sampling=cfg["balanced_sampling"],
    )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\nDevice: {device}")
    if device.type == "cuda":
        print(f"GPU   : {torch.cuda.get_device_name(0)}\n")

    set_seed(cfg["seed"])
    if device.type == "cuda":
        torch.cuda.manual_seed_all(cfg["seed"])

    import wandb

    # ── Model ─────────────────────────────────────────────────────────────────
    print("Building model...")
    from src.model import SkinFuseNetModel

    model = SkinFuseNetModel(
        num_classes=cfg["num_classes"],
        embed_dim=cfg["embed_dim"],
        pretrained=cfg["pretrained"],
        freeze_bert=cfg["freeze_bert"],
    ).to(device)

    total     = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Parameters — total: {total:,}  trainable: {trainable:,}\n")

    # ── Loss ──────────────────────────────────────────────────────────────────
    criterion = FocalLoss(
        gamma=cfg["focal_gamma"],
        label_smoothing=cfg["label_smoothing"],
        num_classes=cfg["num_classes"],
    ).to(device)

    # ── Optimiser ─────────────────────────────────────────────────────────────
    optimizer = AdamW(
        model.parameters(),
        lr=cfg["lr"],
        weight_decay=cfg["weight_decay"],   # paper: 1e-2
    )

    # ── Scheduler: linear warmup → cosine annealing ───────────────────────────
    # Warmup: LR rises from lr/10 to lr over warmup_epochs
    # After: cosine decay from lr to 0 over remaining epochs
    warmup_epochs   = cfg["warmup_epochs"]
    cosine_epochs   = cfg["epochs"] - warmup_epochs

    warmup_scheduler = LinearLR(
        optimizer,
        start_factor=0.1,
        end_factor=1.0,
        total_iters=warmup_epochs,
    )
    cosine_scheduler = CosineAnnealingLR(
        optimizer,
        T_max=cosine_epochs,
        eta_min=1e-6,
    )
    scheduler = SequentialLR(
        optimizer,
        schedulers=[warmup_scheduler, cosine_scheduler],
        milestones=[warmup_epochs],
    )

    # ── Mixed precision scaler ────────────────────────────────────────────────
    scaler = torch.amp.GradScaler(
        "cuda",
        enabled=device.type == "cuda",
    )

    # ── W&B ───────────────────────────────────────────────────────────────────
    wandb.init(
        project=cfg["wandb_project"],
        name=cfg["wandb_run"],
        config=cfg,
    )

    # ── Checkpoint dir ────────────────────────────────────────────────────────
    ckpt_dir = Path(cfg["checkpoint_dir"])
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    best_ckpt_path = ckpt_dir / "best_model.pt"
    last_ckpt_path = ckpt_dir / "last_model.pt"

    start_epoch = 1
    best_val_f1 = 0.0
    patience_counter = 0
    if cfg["resume"] and last_ckpt_path.exists():
        checkpoint_config = torch.load(
            last_ckpt_path, map_location="cpu", weights_only=True
        ).get("config", {})
        is_smoke_checkpoint = (
            checkpoint_config.get("max_train_batches") is not None
            or checkpoint_config.get("max_eval_batches") is not None
        )
        if is_smoke_checkpoint:
            print("Ignoring smoke-test checkpoint; starting full training from epoch 1.")
        else:
            (
                completed_epoch,
                best_val_f1,
                patience_counter,
                _,
            ) = load_checkpoint(
                last_ckpt_path, model, optimizer, scheduler, scaler
            )
            start_epoch = completed_epoch + 1
            print(
                f"Resuming from epoch {start_epoch} "
                f"(last completed epoch: {completed_epoch})"
            )
            if start_epoch > cfg["bert_unfreeze_epoch"]:
                model.unfreeze_bert()

    # ── Training loop ─────────────────────────────────────────────────────────
    print(f"Starting training for up to {cfg['epochs']} epochs...\n")
    print(f"Early stopping patience : {cfg['early_stop_patience']} epochs")
    print(f"BERT unfreeze at epoch  : {cfg['bert_unfreeze_epoch']}\n")

    for epoch in range(start_epoch, cfg["epochs"] + 1):
        t_start = time.time()

        # ── Unfreeze BERT after warmup ────────────────────────────────────────
        if epoch == cfg["bert_unfreeze_epoch"]:
            model.unfreeze_bert()

        # ── Train ─────────────────────────────────────────────────────────────
        train_metrics = train_one_epoch(
            model, train_loader, optimizer, criterion, scaler, device,
            accumulation_steps=cfg["gradient_accumulation_steps"],
            max_batches=cfg["max_train_batches"],
        )

        # ── Validate ──────────────────────────────────────────────────────────
        val_metrics = evaluate(
            model, val_loader, criterion, device,
            max_batches=cfg["max_eval_batches"],
        )

        # ── Scheduler step ────────────────────────────────────────────────────
        scheduler.step()
        current_lr = scheduler.get_last_lr()[0]

        # ── Log to W&B ────────────────────────────────────────────────────────
        wandb.log({
            "epoch":           epoch,
            "train/loss":      train_metrics["loss"],
            "train/accuracy":  train_metrics["accuracy"],
            "train/macro_f1":  train_metrics["macro_f1"],
            "val/loss":        val_metrics["loss"],
            "val/accuracy":    val_metrics["accuracy"],
            "val/macro_f1":    val_metrics["macro_f1"],
            "lr":              current_lr,
        })

        elapsed = time.time() - t_start
        print(
            f"Epoch {epoch:3d}/{cfg['epochs']}  "
            f"| Train loss={train_metrics['loss']:.4f}  F1={train_metrics['macro_f1']:.4f}  "
            f"| Val   loss={val_metrics['loss']:.4f}  F1={val_metrics['macro_f1']:.4f}  "
            f"| LR={current_lr:.2e}  | {elapsed:.1f}s"
        )

        # ── Checkpoint — always save latest ───────────────────────────────────
        save_checkpoint(
            last_ckpt_path, model, optimizer, scheduler,
            scaler, epoch, best_val_f1, patience_counter, cfg
        )

        # ── Checkpoint — save best ────────────────────────────────────────────
        val_f1 = val_metrics["macro_f1"]
        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            patience_counter = 0
            save_checkpoint(
                best_ckpt_path, model, optimizer, scheduler,
                scaler, epoch, best_val_f1, patience_counter, cfg
            )
            print(f"  ✅ New best val macro F1: {best_val_f1:.4f} — checkpoint saved.")
        else:
            patience_counter += 1
            print(f"  ⏳ No improvement. Patience: {patience_counter}/{cfg['early_stop_patience']}")

        # ── Early stopping ────────────────────────────────────────────────────
        if patience_counter >= cfg["early_stop_patience"]:
            print(f"\n⛔ Early stopping triggered at epoch {epoch}.")
            print(f"   Best val macro F1: {best_val_f1:.4f}")
            break

    # ── Final test evaluation ─────────────────────────────────────────────────
    print("\nLoading best checkpoint for test evaluation...")
    best_ckpt = torch.load(best_ckpt_path, map_location=device)
    model.load_state_dict(best_ckpt["model_state"])

    test_metrics = evaluate(
        model, test_loader, criterion, device,
        max_batches=cfg["max_eval_batches"],
    )
    print("\n" + "=" * 55)
    print("Test set results (best model checkpoint):")
    print(f"  Loss     : {test_metrics['loss']:.4f}")
    print(f"  Accuracy : {test_metrics['accuracy'] * 100:.2f}%")
    print(f"  Macro F1 : {test_metrics['macro_f1']:.4f}")
    print("=" * 55)

    wandb.log({
        "test/loss":     test_metrics["loss"],
        "test/accuracy": test_metrics["accuracy"],
        "test/macro_f1": test_metrics["macro_f1"],
    })
    wandb.finish()

    print(f"\nDone. Best checkpoint saved at: {best_ckpt_path}")


if __name__ == "__main__":
    main()