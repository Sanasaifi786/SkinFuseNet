import sys
from pathlib import Path

# ── sys.path fix MUST come before any src.* imports ──────────────────────────
# Adds the ml/ directory to Python path so 'src' package is resolvable
ml_dir = Path(__file__).resolve().parents[1]
if str(ml_dir) not in sys.path:
    sys.path.insert(0, str(ml_dir))

import torch
import torch.nn as nn

from src.branches.cnn  import EfficientNetV2Branch
from src.branches.vit  import SwinTransformerBranch
from src.branches.bert import BertMetadataBranch
from src.fusion        import CrossAttentionFusion


class SkinFuseNetModel(nn.Module):
    """
    SkinFuseNet — Unified Tri-Modal Architecture for Skin Lesion Diagnosis.

    Pipeline:
        image  → EfficientNetV2   → [B, 512]  ─┐
        image  → Swin Transformer → [B, 512]  ──→ CrossAttentionFusion → [B, 512] → Classifier → [B, 7]
        tokens → BERT encoder     → [B, 512]  ─┘

    If metadata tokens are not provided (input_ids=None), the metadata branch
    output is replaced with zeros — model still runs image-only.
    """

    def __init__(
        self,
        num_classes=7,
        embed_dim=512,
        pretrained=True,
        freeze_bert=True,
        dropout=0.3,
    ):
        """
        Args:
            num_classes : number of diagnostic classes (HAM10000 = 7)
            embed_dim   : shared embedding dimension across all branches
            pretrained  : load pretrained weights for CNN and ViT branches
            freeze_bert : freeze BERT backbone at init (unfreeze after warmup)
            dropout     : dropout in classification head
        """
        super().__init__()
        self.num_classes = num_classes
        self.embed_dim   = embed_dim

        # ── Three parallel branches ───────────────────────────────────────────
        self.cnn_branch  = EfficientNetV2Branch(embed_dim=embed_dim, pretrained=pretrained)
        self.vit_branch  = SwinTransformerBranch(embedding_dim=embed_dim, pretrained=pretrained)
        self.bert_branch = BertMetadataBranch(embed_dim=embed_dim,
                                              pretrained=pretrained,
                                              freeze_bert=freeze_bert)

        # ── Cross-attention fusion ────────────────────────────────────────────
        self.fusion = CrossAttentionFusion(embedding_dim=embed_dim, num_heads=8)

        # ── Classification head ───────────────────────────────────────────────
        self.classifier = nn.Sequential(
            nn.LayerNorm(embed_dim),
            nn.Dropout(p=dropout),
            nn.Linear(embed_dim, num_classes),
        )

    def forward(
        self,
        image:          torch.Tensor,
        input_ids:      torch.Tensor = None,
        attention_mask: torch.Tensor = None,
    ) -> torch.Tensor:
        """
        Args:
            image          : [B, 3, 256, 256] preprocessed lesion image
            input_ids      : [B, 128] BERT token IDs  (optional)
            attention_mask : [B, 128] BERT attention mask (optional)

        Returns:
            logits : [B, num_classes] raw classification scores
        """
        device     = image.device
        batch_size = image.size(0)

        # ── Branch forward passes (CNN and ViT run in parallel on same image) ─
        cnn_features = self.cnn_branch(image)   # [B, 512]
        vit_features = self.vit_branch(image)   # [B, 512]

        # ── BERT branch (zero-fallback if no metadata provided) ───────────────
        if input_ids is not None and attention_mask is not None:
            meta_features = self.bert_branch(input_ids, attention_mask)  # [B, 512]
        else:
            meta_features = torch.zeros(batch_size, self.embed_dim, device=device)

        # ── Fusion ────────────────────────────────────────────────────────────
        fused = self.fusion(cnn_features, vit_features, meta_features)  # [B, 512]

        # ── Classification ────────────────────────────────────────────────────
        logits = self.classifier(fused)   # [B, 7]

        return logits

    def get_gradcam_target_layer(self):
        """
        Returns the target convolutional layer for GradCAM heatmap generation.
        Must point to the last conv layer in the CNN branch (conv_head).
        Wrong layer = blank white heatmap.
        """
        return self.cnn_branch.target_layer

    def unfreeze_bert(self):
        """
        Unfreeze BERT backbone for fine-tuning.
        Call this from training loop after warmup epochs (e.g. epoch 5).
        """
        self.bert_branch.unfreeze_backbone()
        print("BERT backbone unfrozen — all layers now trainable.")


# ── Verification ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 65)
    print("SkinFuseNetModel — full assembly verification")
    print("=" * 65)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    # Init with pretrained=False for fast testing
    model = SkinFuseNetModel(
        num_classes=7,
        embed_dim=512,
        pretrained=False,
        freeze_bert=True,
    ).to(device)

    B = 2
    fake_images  = torch.randn(B, 3, 256, 256, device=device)
    fake_ids     = torch.randint(0, 1000, (B, 128), device=device)
    fake_masks   = torch.ones(B, 128, dtype=torch.long, device=device)

    # ── Forward pass ─────────────────────────────────────────────────────────
    print("\n[1/4] Forward pass...")
    model.eval()
    with torch.no_grad():
        logits = model(fake_images, fake_ids, fake_masks)
    print(f"  Output logits shape : {logits.shape}")   # [2, 7]
    assert logits.shape == (B, 7)
    print("  ✅ Shape correct")

    # ── Forward pass without metadata (zero fallback) ─────────────────────────
    print("\n[2/4] Image-only forward (no metadata)...")
    with torch.no_grad():
        logits_no_meta = model(fake_images)
    print(f"  Output shape : {logits_no_meta.shape}")  # [2, 7]
    assert logits_no_meta.shape == (B, 7)
    print("  ✅ Zero-fallback works")

    # ── Backward pass ─────────────────────────────────────────────────────────
    print("\n[3/4] Backward pass (gradient flow)...")
    model.train()
    loss = model(fake_images, fake_ids, fake_masks).sum()
    loss.backward()
    print("  ✅ Gradients computed across full graph")

    # ── Parameter audit ───────────────────────────────────────────────────────
    print("\n[4/4] Parameter audit:")
    total     = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    frozen    = total - trainable
    print(f"  Total parameters     : {total:,}")
    print(f"  Trainable parameters : {trainable:,}")
    print(f"  Frozen (BERT)        : {frozen:,}")

    print("\n✅ SkinFuseNetModel verified successfully.")
    print("=" * 65)