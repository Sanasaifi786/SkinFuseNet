import torch
import torch.nn as nn


class CrossAttentionFusion(nn.Module):
    """
    Cross-attention fusion module for SkinFuseNet.

    Fuses three branch embeddings (CNN, ViT, metadata) using two sequential
    cross-attention operations — as described in the paper:

        Step 1: CNN embedding attends to ViT embedding
                → captures image-level local-global alignment
        Step 2: Result attends to metadata embedding
                → integrates clinical context to resolve visual ambiguity

    This is better than simple addition (CNN + ViT) followed by one attention
    with metadata, because each modality dynamically attends to relevant
    information from the others rather than being treated equally.

    Each attention step is followed by:
        - Residual connection (input + attention output)
        - LayerNorm
        - Feed-forward network (Linear → GELU → Linear)
        - Residual + LayerNorm
    """

    def __init__(self, embedding_dim=512, num_heads=8, ffn_expansion=4, dropout=0.1):
        """
        Args:
            embedding_dim  : shared embedding dimension from all branches (default 512)
            num_heads      : number of attention heads (default 8)
            ffn_expansion  : feed-forward inner dimension multiplier (default 4 → 2048)
            dropout        : dropout rate in attention and FFN (default 0.1)
        """
        super().__init__()

        # ── Cross-attention 1: CNN attends to ViT ────────────────────────────
        self.cross_attn_1 = nn.MultiheadAttention(
            embed_dim=embedding_dim,
            num_heads=num_heads,
            dropout=dropout,
            batch_first=True,   # input shape: [B, seq_len, embed_dim]
        )
        self.norm1 = nn.LayerNorm(embedding_dim)

        # ── Feed-forward 1 ────────────────────────────────────────────────────
        ffn_dim = embedding_dim * ffn_expansion
        self.ffn1 = nn.Sequential(
            nn.Linear(embedding_dim, ffn_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(ffn_dim, embedding_dim),
            nn.Dropout(dropout),
        )
        self.norm2 = nn.LayerNorm(embedding_dim)

        # ── Cross-attention 2: result attends to metadata ─────────────────────
        self.cross_attn_2 = nn.MultiheadAttention(
            embed_dim=embedding_dim,
            num_heads=num_heads,
            dropout=dropout,
            batch_first=True,
        )
        self.norm3 = nn.LayerNorm(embedding_dim)

        # ── Feed-forward 2 ────────────────────────────────────────────────────
        self.ffn2 = nn.Sequential(
            nn.Linear(embedding_dim, ffn_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(ffn_dim, embedding_dim),
            nn.Dropout(dropout),
        )
        self.norm4 = nn.LayerNorm(embedding_dim)

    def forward(
        self,
        cnn_features:      torch.Tensor,
        vit_features:      torch.Tensor,
        metadata_features: torch.Tensor,
    ) -> torch.Tensor:
        """
        Args:
            cnn_features      : [B, embedding_dim] — from EfficientNetV2 branch
            vit_features      : [B, embedding_dim] — from Swin Transformer branch
            metadata_features : [B, embedding_dim] — from BERT branch

        Returns:
            fused embedding   : [B, embedding_dim]
        """
        # MultiheadAttention expects [B, seq_len, embed_dim]
        # Our embeddings are [B, embed_dim] — add seq_len=1 dimension
        q1 = cnn_features.unsqueeze(1)           # [B, 1, D]
        k1 = vit_features.unsqueeze(1)           # [B, 1, D]
        v1 = vit_features.unsqueeze(1)           # [B, 1, D]

        # ── Step 1: CNN queries ViT ───────────────────────────────────────────
        attn1_out, _ = self.cross_attn_1(query=q1, key=k1, value=v1)
        x = self.norm1(q1 + attn1_out)           # residual + norm: [B, 1, D]

        # Feed-forward 1
        x = self.norm2(x + self.ffn1(x))         # [B, 1, D]

        # ── Step 2: result queries metadata ──────────────────────────────────
        k2 = metadata_features.unsqueeze(1)      # [B, 1, D]
        v2 = metadata_features.unsqueeze(1)      # [B, 1, D]

        attn2_out, _ = self.cross_attn_2(query=x, key=k2, value=v2)
        x = self.norm3(x + attn2_out)            # residual + norm: [B, 1, D]

        # Feed-forward 2
        x = self.norm4(x + self.ffn2(x))         # [B, 1, D]

        # Remove seq_len dimension → [B, D]
        return x.squeeze(1)


# ── Verification ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("CrossAttentionFusion — verification")
    print("=" * 55)

    fusion = CrossAttentionFusion(embedding_dim=512, num_heads=8)

    fake_cnn  = torch.randn(4, 512)
    fake_vit  = torch.randn(4, 512)
    fake_bert = torch.randn(4, 512)

    output = fusion(fake_cnn, fake_vit, fake_bert)

    print(f"\nInput shapes  : CNN={fake_cnn.shape}  ViT={fake_vit.shape}  BERT={fake_bert.shape}")
    print(f"Output shape  : {output.shape}")   # [4, 512]
    assert output.shape == (4, 512), f"Expected [4, 512], got {output.shape}"

    # Backward pass — verify gradients flow
    loss = output.sum()
    loss.backward()
    print("Backward pass : ✅ gradients computed")

    # Parameter count
    total     = sum(p.numel() for p in fusion.parameters())
    print(f"Parameters    : {total:,}")

    print("\n✅ CrossAttentionFusion verified successfully.")
    print("=" * 55)