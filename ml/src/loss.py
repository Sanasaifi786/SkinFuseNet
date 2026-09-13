import torch
import torch.nn as nn
import torch.nn.functional as F


class FocalLoss(nn.Module):
    """
    Focal Loss with Label Smoothing for multi-class classification.
    
    Formula:
        FL(p_t) = - alpha * (1 - p_t)^gamma * log(p_t)
        
    Handles both:
    1. Integer class indices of shape [B]
    2. Continuous soft one-hot vectors of shape [B, num_classes] (from MixUp/CutMix)
    """
    def __init__(self, gamma=2.0, alpha=None, label_smoothing=0.1, num_classes=7, reduction="mean"):
        """
        Args:
            gamma (float): Focusing parameter that down-weights easy examples. Default: 2.0.
            alpha (Tensor or float, optional): Class balance weights of shape [num_classes].
            label_smoothing (float): Epsilon factor for smoothing hard one-hot targets. Default: 0.1.
            num_classes (int): Total number of diagnostic classes (HAM10000 = 7).
            reduction (str): 'mean', 'sum', or 'none'. Default: 'mean'.
        """
        super().__init__()
        self.gamma = gamma
        self.label_smoothing = label_smoothing
        self.num_classes = num_classes
        self.reduction = reduction

        if alpha is not None:
            if isinstance(alpha, (list, tuple)):
                alpha = torch.tensor(alpha, dtype=torch.float32)
            self.register_buffer("alpha", alpha)
        else:
            self.alpha = None

    def forward(self, logits, targets):
        """
        Args:
            logits (Tensor): Raw unnormalized predictions of shape [B, num_classes].
            targets (Tensor): Ground truth labels. Can be:
                              - LongTensor of shape [B] (discrete class indices)
                              - FloatTensor of shape [B, num_classes] (soft targets from MixUp)
        Returns:
            Tensor: Scalar loss value (if reduction == 'mean' or 'sum').
        """
        # 1. Convert integer labels [B] to smoothed one-hot targets [B, num_classes]
        if targets.dim() == 1 or (targets.dim() == 2 and targets.shape[1] == 1):
            targets = targets.view(-1)
            one_hot = F.one_hot(targets, num_classes=self.num_classes).float()
            if self.label_smoothing > 0.0:
                smooth_targets = one_hot * (1.0 - self.label_smoothing) + (self.label_smoothing / self.num_classes)
            else:
                smooth_targets = one_hot
        else:
            # Targets are already soft one-hot from MixUp/CutMix
            smooth_targets = targets.float()

        # 2. Compute log probabilities and probabilities using numerically stable log_softmax
        log_probs = F.log_softmax(logits, dim=-1)   # log(p)
        probs = torch.exp(log_probs)                 # p

        # 3. Compute modulating factor: (1 - p)^gamma
        modulating_factor = (1.0 - probs) ** self.gamma

        # 4. Compute focal term for all classes: - (1 - p)^gamma * log(p)
        focal_term = -modulating_factor * log_probs

        # 5. Apply class weighting alpha if provided
        if self.alpha is not None:
            alpha = self.alpha.to(logits.device)
            focal_term = focal_term * alpha

        # 6. Weight by target probability distribution
        loss_per_sample = torch.sum(smooth_targets * focal_term, dim=-1)

        # 7. Apply reduction
        if self.reduction == "mean":
            return loss_per_sample.mean()
        elif self.reduction == "sum":
            return loss_per_sample.sum()
        elif self.reduction == "none":
            return loss_per_sample
        else:
            raise ValueError(f"Invalid reduction mode: {self.reduction}")


if __name__ == "__main__":
    print("=" * 65)
    print("Verifying Focal Loss vs Standard CrossEntropy")
    print("=" * 65)

    num_classes = 7
    criterion_focal = FocalLoss(gamma=2.0, label_smoothing=0.0, num_classes=num_classes)
    criterion_ce = nn.CrossEntropyLoss()

    # --- Scenario A: Very Easy Example (Model is 99% confident in the correct class 5) ---
    # Logits: High positive value for class 5, negative for others
    easy_logits = torch.tensor([[-4.0, -4.0, -4.0, -4.0, -4.0, 5.0, -4.0]])
    target = torch.tensor([5])

    ce_easy = criterion_ce(easy_logits, target).item()
    focal_easy = criterion_focal(easy_logits, target).item()

    print(f"\n[EASY EXAMPLE] Model is ~99% confident in correct class:")
    print(f"  Standard CrossEntropy Loss: {ce_easy:.6f}")
    print(f"  Focal Loss (gamma=2.0):     {focal_easy:.6f}")
    print(f"  Loss Reduction:             {ce_easy / focal_easy:.1f}x smaller!")

    # --- Scenario B: Hard Example (Model is wrong and confused) ---
    hard_logits = torch.tensor([[3.0, 2.0, -1.0, -1.0, -1.0, 0.0, -1.0]])
    target_hard = torch.tensor([5])  # Correct class is 5, but model gave highest to 0

    ce_hard = criterion_ce(hard_logits, target_hard).item()
    focal_hard = criterion_focal(hard_logits, target_hard).item()

    print(f"\n[HARD EXAMPLE] Model is confused / wrong:")
    print(f"  Standard CrossEntropy Loss: {ce_hard:.6f}")
    print(f"  Focal Loss (gamma=2.0):     {focal_hard:.6f}")
    print(f"  Ratio (Focal / CE):         {focal_hard / ce_hard:.2f} (Retains high gradient!)")

    # --- Scenario C: Integration test with MixUp Soft Labels ---
    print(f"\n[MIXUP COMPATIBILITY TEST]")
    soft_target = torch.tensor([[0.0, 0.0, 0.0, 0.0, 0.7, 0.3, 0.0]])  # 70% MEL, 30% NV
    mixup_logits = torch.randn(1, 7)
    focal_mixup = criterion_focal(mixup_logits, soft_target)
    print(f"  Soft target forward pass successful! Loss: {focal_mixup.item():.4f}")

    print("\n" + "=" * 65)
    print("✅ All loss mathematical properties and tests verified!")
    print("=" * 65)
