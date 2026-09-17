import sys
from pathlib import Path
import torch
import torch.nn as nn

from src.branches.cnn import EfficientNetV2Branch
from src.branches.vit import SwinTransformerBranch
from src.branches.bert import BertMetadataBranch
from src.fusion import CrossAttentionFusion

ml_dir = Path(__file__).resolve().parents[1]
if str(ml_dir) not in sys.path:
    sys.path.insert(0, str(ml_dir))

class SkinFuseNetModel(nn.Module):
    """
    SkinFuseNet: Unified Tri-Modal Architecture for Skin Lesion Diagnosis.
    
    Combines:
    - CNN Branch (EfficientNetV2-S) for local texture and borders
    - ViT Branch (Swin Transformer V2) for global visual relationships
    - BERT Branch (bert-base-uncased) for clinical metadata context
    - Cross-Attention Fusion module
    - Linear Classification Head for 7 diagnostic classes
    """
    def __init__(
        self,
        num_classes=7,
        embed_dim=512,
        pretrained=True,
        freeze_bert=True,
        dropout=0.3
    ):
        super().__init__()
        self.num_classes = num_classes
        self.embed_dim = embed_dim

        self.cnn_branch = EfficientNetV2Branch(embed_dim=embed_dim, pretrained=pretrained)
        self.vit_branch = SwinTransformerBranch(embedding_dim=embed_dim)
        self.bert_branch = BertMetadataBranch(embed_dim=embed_dim, pretrained=pretrained, freeze_bert=freeze_bert)
        self.fusion = CrossAttentionFusion(embedding_dim=embed_dim, num_heads=8)

        self.classifier = nn.Sequential(
            nn.LayerNorm(embed_dim),
            nn.Dropout(p=dropout),
            nn.Linear(embed_dim, num_classes)
        )

    def forward(self, image, input_ids=None, attention_mask=None):
        """
        Forward pass for the full multimodal model.
        
        Args:
            image (Tensor): Preprocessed image tensor of shape [B, 3, 256, 256]
            input_ids (Tensor, optional): Token IDs of shape [B, 128]
            attention_mask (Tensor, optional): Attention mask of shape [B, 128]
            
        Returns:
            Tensor: Raw classification logits of shape [B, 7]
        """
        device = image.device
        batch_size = image.size(0)

        cnn_features = self.cnn_branch(image)  # [B, 512]
        vit_features = self.vit_branch(image)  # [B, 512]

        if input_ids is not None and attention_mask is not None:
            meta_features = self.bert_branch(input_ids, attention_mask)  # [B, 512]
        else:
            meta_features = torch.zeros(batch_size, self.embed_dim, device=device)

        fused_features = self.fusion(cnn_features, vit_features, meta_features)  # [B, 512]

        logits = self.classifier(fused_features)  # [B, 7]

        return logits

    def get_gradcam_target_layer(self):
        """Returns target convolutional layer from CNN branch for GradCAM visualization."""
        return self.cnn_branch.target_layer


if __name__ == "__main__":
    print("=" * 65)
    print("Testing Full SkinFuseNetModel Assembly...")
    print("=" * 65)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Target execution device: {device}")

    print("\n[1/4] Initializing complete SkinFuseNetModel...")
    model = SkinFuseNetModel(num_classes=7, embed_dim=512, pretrained=False).to(device)
    model.eval()

    batch_size = 2
    fake_images = torch.randn(batch_size, 3, 256, 256, device=device)
    fake_input_ids = torch.randint(0, 1000, (batch_size, 128), device=device)
    fake_attention_mask = torch.ones((batch_size, 128), device=device)

    print("\n[2/4] Executing Forward Pass...")
    with torch.no_grad():
        logits = model(fake_images, fake_input_ids, fake_attention_mask)

    print(f"  Input image shape:   {fake_images.shape}")
    print(f"  Input tokens shape:  {fake_input_ids.shape}")
    print(f"  Output logits shape: {logits.shape} (Expected: [{batch_size}, 7])")
    assert logits.shape == (batch_size, 7), f"Expected [{batch_size}, 7], got {logits.shape}"

    print("\n[3/4] Verifying Backward Pass & Gradient Flow...")
    model.train()
    fake_loss = model(fake_images, fake_input_ids, fake_attention_mask).sum()
    fake_loss.backward()
    print("  Gradients computed successfully across the full graph!")

    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)

    print("\n[4/4] Model Complexity Audit:")
    print(f"  Total Parameters:     {total_params:,}")
    print(f"  Trainable Parameters: {trainable_params:,}")
    print("-" * 65)
    print("[SUCCESS] Complete SkinFuseNetModel successfully assembled and verified!")
    print("=" * 65)
