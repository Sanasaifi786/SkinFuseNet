import torch
import torch.nn as nn
import timm


class SwinTransformerBranch(nn.Module):
    """
    Swin Transformer V2 branch for global context feature extraction.

    - Loads swinv2_tiny_window16_256 with pretrained weights via timm
    - num_classes=0 removes classification head and returns pooled features
    - Projects features to shared embedding dimension (default 512)
    - LayerNorm + Dropout added for consistency with CNN and BERT branches
    """

    def __init__(self, embedding_dim=512, pretrained=True):
        """
        Args:
            embedding_dim : shared embedding dimension across all branches (default 512)
            pretrained    : load ImageNet pretrained weights
        """
        super().__init__()

        # ── Backbone ──────────────────────────────────────────────────────────
        # num_classes=0 removes head and returns pooled [B, in_features]
        self.swin = timm.create_model(
            'swinv2_tiny_window16_256',
            pretrained=pretrained,
            num_classes=0
        )
        in_features = self.swin.num_features  # dynamic — depends on variant

        # ── Projection: in_features → embedding_dim ───────────────────────────
        # LayerNorm + Dropout added to match CNN branch regularisation
        # Original vit.py had only nn.Linear here — inconsistent with other branches
        self.projector = nn.Sequential(
            nn.Linear(in_features, embedding_dim),
            nn.LayerNorm(embedding_dim),
            nn.Dropout(p=0.3),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x : image tensor [B, 3, 256, 256]

        Returns:
            embedding [B, embedding_dim]
        """
        features  = self.swin(x)              # [B, in_features]
        embedding = self.projector(features)  # [B, embedding_dim]
        return embedding


# ── Verification ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("SwinTransformerBranch — verification")
    print("=" * 55)

    model = SwinTransformerBranch(embedding_dim=512, pretrained=True)
    model.eval()

    dummy = torch.randn(2, 3, 256, 256)
    print(f"\nInput  shape : {dummy.shape}")

    with torch.no_grad():
        output = model(dummy)

    print(f"Output shape : {output.shape}")   # [2, 512]
    assert output.shape == (2, 512), f"Expected [2, 512], got {output.shape}"

    # Cross-verify with CNN branch
    from cnn import EfficientNetV2Branch
    cnn = EfficientNetV2Branch(embed_dim=512, pretrained=False)
    cnn_out = cnn(dummy)
    assert cnn_out.shape == output.shape, (
        f"Shape mismatch between CNN {cnn_out.shape} and ViT {output.shape}"
    )
    print(f"Cross-branch shape match: CNN={cnn_out.shape} ViT={output.shape} ✅")

    # Parameter count
    total     = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"\nTotal parameters     : {total:,}")
    print(f"Trainable parameters : {trainable:,}")

    print("\n✅ SwinTransformerBranch verified successfully.")
    print("=" * 55)