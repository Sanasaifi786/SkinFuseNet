import torch
import torch.nn as nn
import timm


class EfficientNetV2Branch(nn.Module):
    """
    EfficientNetV2-S CNN branch for local texture and border feature extraction.

    - Loads EfficientNetV2-S with ImageNet pretrained weights via timm
    - Removes the classification head (num_classes=0) — returns pooled features
    - Projects features to shared embedding dimension (default 512)
    - Registers forward/backward hooks on conv_head for GradCAM visualisation
    """

    def __init__(self, embed_dim=512, pretrained=True):
        """
        Args:
            embed_dim  : shared embedding dimension across all branches (default 512)
            pretrained : load ImageNet pretrained weights
        """
        super().__init__()

        # ── Backbone ──────────────────────────────────────────────────────────
        # num_classes=0 removes classification head, outputs pooled [B, in_features]
        self.backbone = timm.create_model(
            'tf_efficientnetv2_s',
            pretrained=pretrained,
            num_classes=0
        )
        self.in_features = self.backbone.num_features  # 1280 for EfficientNetV2-S

        # ── Projection: in_features → embed_dim ──────────────────────────────
        self.projection = nn.Sequential(
            nn.Linear(self.in_features, embed_dim),
            nn.GELU(),
            nn.Dropout(p=0.3),
        )

        # ── GradCAM hooks ─────────────────────────────────────────────────────
        # Target layer: conv_head is the last convolutional layer in EfficientNetV2
        # GradCAM MUST target this layer — wrong layer = blank white heatmap
        self.gradients  = None
        self.activations = None
        self.target_layer = self.backbone.conv_head
        self.target_layer.register_forward_hook(self._forward_hook)
        self.target_layer.register_full_backward_hook(self._backward_hook)

    def _forward_hook(self, module, input, output):
        """Captures feature map activations during forward pass."""
        self.activations = output

    def _backward_hook(self, module, grad_input, grad_output):
        """Captures gradients during backward pass."""
        self.gradients = grad_output[0]

    def get_activations(self) -> torch.Tensor:
        """Returns captured activations for GradCAM computation."""
        return self.activations

    def get_gradients(self) -> torch.Tensor:
        """Returns captured gradients for GradCAM computation."""
        return self.gradients

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x : image tensor [B, 3, 256, 256]

        Returns:
            embedding [B, embed_dim]
        """
        features  = self.backbone(x)       # [B, 1280]
        projected = self.projection(features)  # [B, 512]
        return projected


# ── Verification ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("EfficientNetV2Branch — verification")
    print("=" * 55)

    model = EfficientNetV2Branch(embed_dim=512, pretrained=False)

    # Forward pass
    dummy = torch.randn(2, 3, 256, 256)
    output = model(dummy)
    print(f"\nInput  shape : {dummy.shape}")
    print(f"Output shape : {output.shape}")   # [2, 512]
    assert output.shape == (2, 512), f"Expected [2, 512], got {output.shape}"

    # Backward pass — verify GradCAM hooks capture correctly
    loss = output.sum()
    loss.backward()

    grads = model.get_gradients()
    acts  = model.get_activations()
    print(f"\nGradCAM hooks:")
    print(f"  Gradients captured   : {grads is not None}")
    print(f"  Activations captured : {acts is not None}")
    if grads is not None:
        print(f"  Gradient shape       : {grads.shape}")
        print(f"  Activation shape     : {acts.shape}")

    # Parameter count
    total     = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"\nTotal parameters     : {total:,}")
    print(f"Trainable parameters : {trainable:,}")

    print("\n✅ EfficientNetV2Branch verified successfully.")
    print("=" * 55)