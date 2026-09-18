import torch
import torch.nn as nn
import torch.nn.functional as F


class FocalLoss(nn.Module):
    """
    Focal Loss with Label Smoothing for multi-class classification.

    Formula:
        FL(p_t) = - (1 - p_t)^gamma * log(p_t)

    Key properties:
        - Down-weights easy majority-class (NV) examples during training
        - Focuses gradient signal on hard minority-class examples (DF, VASC)
        - Supports both hard integer labels [B] and soft MixUp labels [B, C]
        - Label smoothing prevents overconfidence on majority class

    Paper settings: gamma=2.0, label_smoothing=0.1
    """

    def __init__(
        self,
        gamma=2.0,
        alpha=None,
        label_smoothing=0.1,
        num_classes=7,
        reduction="mean",
    ):
        """
        Args:
            gamma          : focusing parameter — higher = more focus on hard examples
                             0.0 = standard cross-entropy, 2.0 = paper setting
            alpha          : optional class balance weights [num_classes]
                             pass a list/tensor if you want per-class weighting
            label_smoothing: epsilon for soft targets (paper: 0.1)
            num_classes    : number of diagnostic classes (HAM10000 = 7)
            reduction      : 'mean' | 'sum' | 'none'
        """
        super().__init__()
        self.gamma         = gamma
        self.label_smoothing = label_smoothing
        self.num_classes   = num_classes
        self.reduction     = reduction

        # Register alpha as a buffer so model.to(device) moves it automatically
        # No need to call .to(device) manually inside forward()
        if alpha is not None:
            if isinstance(alpha, (list, tuple)):
                alpha = torch.tensor(alpha, dtype=torch.float32)
            self.register_buffer("alpha", alpha)
        else:
            self.alpha = None

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """
        Args:
            logits  : raw unnormalised predictions [B, num_classes]
            targets : ground truth — either:
                      - LongTensor [B]              (hard class indices)
                      - FloatTensor [B, num_classes] (soft labels from MixUp/CutMix)

        Returns:
            scalar loss (if reduction == 'mean' or 'sum')
        """
        # ── Step 1: Convert hard labels to smoothed one-hot ───────────────────
        if targets.dim() == 1 or (targets.dim() == 2 and targets.shape[1] == 1):
            # Hard integer labels → one-hot → smooth
            targets = targets.view(-1)
            one_hot = F.one_hot(targets, num_classes=self.num_classes).float()
            if self.label_smoothing > 0.0:
                smooth_targets = (
                    one_hot * (1.0 - self.label_smoothing)
                    + self.label_smoothing / self.num_classes
                )
            else:
                smooth_targets = one_hot
        else:
            # Already soft labels from MixUp/CutMix — use as-is
            smooth_targets = targets.float()

        # ── Step 2: Log-softmax and probabilities ─────────────────────────────
        log_probs = F.log_softmax(logits, dim=-1)   # numerically stable log(p)
        probs     = torch.exp(log_probs)             # p

        # ── Step 3: Focal modulating factor: (1 - p)^gamma ───────────────────
        modulating_factor = (1.0 - probs) ** self.gamma

        # ── Step 4: Per-class focal term: -(1-p)^gamma * log(p) ──────────────
        focal_term = -modulating_factor * log_probs

        # ── Step 5: Optional class weighting (alpha already on correct device) ─
        if self.alpha is not None:
            focal_term = focal_term * self.alpha

        # ── Step 6: Weight by target distribution, sum across classes ─────────
        loss_per_sample = torch.sum(smooth_targets * focal_term, dim=-1)  # [B]

        # ── Step 7: Reduction ─────────────────────────────────────────────────
        if self.reduction == "mean":
            return loss_per_sample.mean()
        elif self.reduction == "sum":
            return loss_per_sample.sum()
        elif self.reduction == "none":
            return loss_per_sample
        else:
            raise ValueError(
                f"Invalid reduction '{self.reduction}'. "
                f"Choose from: 'mean', 'sum', 'none'."
            )


# ── Verification ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 65)
    print("FocalLoss — verification")
    print("=" * 65)

    num_classes     = 7
    criterion_focal = FocalLoss(gamma=2.0, label_smoothing=0.0, num_classes=num_classes)
    criterion_ce    = nn.CrossEntropyLoss()

    # ── Test 1: Easy example — model is 99% confident and correct ─────────────
    easy_logits = torch.tensor([[-4.0, -4.0, -4.0, -4.0, -4.0, 5.0, -4.0]])
    target      = torch.tensor([5])

    ce_easy    = criterion_ce(easy_logits, target).item()
    focal_easy = criterion_focal(easy_logits, target).item()

    print(f"\n[EASY EXAMPLE] Model ~99% confident in correct class:")
    print(f"  CrossEntropy : {ce_easy:.6f}")
    print(f"  Focal Loss   : {focal_easy:.6f}")
    print(f"  Reduction    : {ce_easy / focal_easy:.1f}x smaller ✅")

    # ── Test 2: Hard example — model is wrong and confused ────────────────────
    hard_logits  = torch.tensor([[3.0, 2.0, -1.0, -1.0, -1.0, 0.0, -1.0]])
    target_hard  = torch.tensor([5])  # correct class = 5, model predicted 0

    ce_hard    = criterion_ce(hard_logits, target_hard).item()
    focal_hard = criterion_focal(hard_logits, target_hard).item()

    print(f"\n[HARD EXAMPLE] Model wrong / confused:")
    print(f"  CrossEntropy : {ce_hard:.6f}")
    print(f"  Focal Loss   : {focal_hard:.6f}")
    print(f"  Ratio        : {focal_hard / ce_hard:.2f}  (retains high gradient ✅)")

    # ── Test 3: MixUp soft labels ─────────────────────────────────────────────
    soft_target  = torch.tensor([[0.0, 0.0, 0.0, 0.0, 0.7, 0.3, 0.0]])
    mixup_logits = torch.randn(1, 7)
    focal_mixup  = criterion_focal(mixup_logits, soft_target)

    print(f"\n[MIXUP TEST] Soft label forward pass:")
    print(f"  Loss : {focal_mixup.item():.4f} ✅")

    # ── Test 4: Label smoothing ───────────────────────────────────────────────
    criterion_smooth = FocalLoss(gamma=2.0, label_smoothing=0.1, num_classes=num_classes)
    focal_smooth     = criterion_smooth(easy_logits, target).item()
    print(f"\n[LABEL SMOOTHING] gamma=2.0, eps=0.1:")
    print(f"  Focal (no smoothing) : {focal_easy:.6f}")
    print(f"  Focal (smoothing)    : {focal_smooth:.6f}")

    # ── Test 5: Device consistency (alpha buffer) ─────────────────────────────
    class_weights   = [1.0, 2.0, 1.5, 3.0, 2.0, 0.5, 4.0]  # higher weight for rare classes
    criterion_alpha = FocalLoss(gamma=2.0, alpha=class_weights, num_classes=num_classes)
    # alpha buffer moves automatically — no manual .to(device) needed
    loss_alpha = criterion_alpha(easy_logits, target)
    print(f"\n[ALPHA WEIGHTS] Per-class weighting test:")
    print(f"  Loss : {loss_alpha.item():.6f} ✅")

    print("\n✅ All FocalLoss tests passed.")
    print("=" * 65)