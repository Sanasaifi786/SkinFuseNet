import torch
import torch.nn as nn
from transformers import BertTokenizer, BertModel


# ── Tokenizer ─────────────────────────────────────────────────────────────────
class MetadataTokenizer:
    """
    Converts raw patient metadata into padded BERT token tensors.
    Loaded once at Dataset init — never inside __getitem__.
    """

    def __init__(self):
        self.tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')

    def tokenize(self, age: int, sex: str, localization: str) -> dict:
        """
        Args:
            age          : patient age (int)
            sex          : 'male' / 'female' / 'unknown'
            localization : anatomical location string

        Returns:
            dict with keys 'input_ids' [1, 128] and 'attention_mask' [1, 128]
        """
        prompt = f"Patient: {age}-year-old {sex}. Lesion location: {localization}."

        tokens = self.tokenizer(
            prompt,
            padding='max_length',   # pad short sequences to exactly 128
            max_length=128,         # fixed length — required for DataLoader batching
            truncation=True,        # cut if somehow longer than 128
            return_tensors='pt'     # return PyTorch tensors
        )
        return tokens


# ── BERT encoder branch ───────────────────────────────────────────────────────
class BertMetadataBranch(nn.Module):
    """
    BERT-based patient metadata encoder.

    Takes tokenised metadata and returns a [B, embed_dim] embedding
    using the [CLS] token output, projected to the shared embedding dimension.

    Freezing strategy:
        All BERT layers frozen at init (freeze_bert=True).
        Training loop unfreezes layer-by-layer after epoch 5.
    """

    def __init__(self, embed_dim=512, pretrained=True, freeze_bert=True):
        """
        Args:
            embed_dim   : shared embedding dimension across all branches (default 512)
            pretrained  : load pretrained bert-base-uncased weights
            freeze_bert : freeze all BERT parameters at init
        """
        super().__init__()

        # ── BERT backbone (12 transformer layers, hidden_size=768) ────────────
        if pretrained:
            self.bert = BertModel.from_pretrained('bert-base-uncased')
        else:
            from transformers import BertConfig
            self.bert = BertModel(BertConfig())

        self.bert_hidden_size = self.bert.config.hidden_size  # 768 for bert-base

        # ── Freeze BERT backbone ──────────────────────────────────────────────
        if freeze_bert:
            self.freeze_backbone()

        # ── Projection: 768 → embed_dim ──────────────────────────────────────
        # LayerNorm + Dropout added for consistency with CNN and ViT branches
        self.projection = nn.Sequential(
            nn.Linear(self.bert_hidden_size, embed_dim),
            nn.LayerNorm(embed_dim),
            nn.Dropout(p=0.2),
        )

    def freeze_backbone(self):
        """Freeze all BERT parameters (called at init)."""
        for param in self.bert.parameters():
            param.requires_grad = False

    def unfreeze_backbone(self):
        """
        Unfreeze all BERT parameters.
        Call this from the training loop after the warmup period (e.g. epoch 5).
        """
        for param in self.bert.parameters():
            param.requires_grad = True

    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
        """
        Args:
            input_ids      : [B, 128] — token IDs from MetadataTokenizer
            attention_mask : [B, 128] — 1 for real tokens, 0 for padding

        Returns:
            Tensor [B, embed_dim]
        """
        # Run through 12 BERT transformer layers
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)

        # [CLS] token at position 0 represents the whole sequence → [B, 768]
        cls_embedding = outputs.last_hidden_state[:, 0, :]

        # Project 768 → embed_dim (512)
        embedding = self.projection(cls_embedding)

        return embedding


# ── Verification ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("BertMetadataBranch — full verification")
    print("=" * 60)

    # ── 1. Tokenizer test ─────────────────────────────────────────────────────
    print("\n[1/3] Tokenizer test")
    tokenizer = MetadataTokenizer()
    result = tokenizer.tokenize(45, "male", "back")
    print(f"  input_ids shape      : {result['input_ids'].shape}")       # [1, 128]
    print(f"  attention_mask shape : {result['attention_mask'].shape}")  # [1, 128]
    real_tokens = result['attention_mask'].sum().item()
    print(f"  Real tokens / padding: {real_tokens} real, {128 - real_tokens} padded")

    # ── 2. Branch forward pass ────────────────────────────────────────────────
    print("\n[2/3] Branch forward pass (batch of 2)")
    model = BertMetadataBranch(embed_dim=512, pretrained=True, freeze_bert=True)
    model.eval()

    s1 = tokenizer.tokenize(68, "female", "lower extremity")
    s2 = tokenizer.tokenize(24, "male",   "back")

    batch_ids   = torch.cat([s1['input_ids'],      s2['input_ids']],      dim=0)  # [2, 128]
    batch_masks = torch.cat([s1['attention_mask'], s2['attention_mask']], dim=0)  # [2, 128]

    with torch.no_grad():
        output = model(batch_ids, batch_masks)

    print(f"  Output shape : {output.shape}")  # [2, 512]
    assert output.shape == (2, 512), f"Expected [2, 512], got {output.shape}"
    print("  ✅ Shape correct")

    # ── 3. Parameter audit ────────────────────────────────────────────────────
    print("\n[3/3] Parameter audit")
    total      = sum(p.numel() for p in model.parameters())
    trainable  = sum(p.numel() for p in model.parameters() if p.requires_grad)
    frozen     = total - trainable
    print(f"  Total parameters     : {total:,}")
    print(f"  Frozen (BERT)        : {frozen:,}")
    print(f"  Trainable (proj only): {trainable:,}")

    print("\n✅ BertMetadataBranch verified successfully.")
    print("=" * 60)