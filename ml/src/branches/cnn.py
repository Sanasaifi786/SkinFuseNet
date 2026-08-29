import torch
import torch.nn as nn
import timm

class EfficientNetV2Branch(nn.Module):
    def __init__(self, embed_dim=512, pretrained=True):
        """
        EfficientNetV2-S branch for visual feature extraction.
        Projects the final feature map into a shared embedding dimension (default 512).
        
        Args:
            embed_dim (int): The shared dimension size across all branches.
            pretrained (bool): Use ImageNet pretrained weights.
        """
        super().__init__()
        
        # Load EfficientNetV2-S using timm
        # num_classes=0 removes the final classification layer, returning pooled features
        self.backbone = timm.create_model('tf_efficientnetv2_s', pretrained=pretrained, num_classes=0)
        
        # Original feature dimension of EfficientNetV2-S before classification is 1280
        self.in_features = self.backbone.num_features 
        
        # Projection layer to match the shared embedding dimension
        self.projection = nn.Sequential(
            nn.Linear(self.in_features, embed_dim),
            nn.GELU(),
            nn.Dropout(p=0.3)
        )
        
        # Hook variables for GradCAM
        self.gradients = None
        self.activations = None
        
        # Register a hook on the final convolutional layer for GradCAM
        # In timm's efficientnet, this is typically `conv_head`
        self.target_layer = self.backbone.conv_head
        self.target_layer.register_forward_hook(self._forward_hook)
        self.target_layer.register_full_backward_hook(self._backward_hook)

    def _forward_hook(self, module, input, output):
        self.activations = output

    def _backward_hook(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def get_activations(self):
        """Returns the activations from the target layer (for GradCAM)."""
        return self.activations

    def get_gradients(self):
        """Returns the gradients from the target layer (for GradCAM)."""
        return self.gradients

    def forward(self, x):
        """
        Forward pass for the CNN branch.
        Args:
            x (Tensor): Image tensor of shape [B, 3, 256, 256]
        Returns:
            Tensor: Feature embeddings of shape [B, embed_dim]
        """
        # Feature extraction (pooled features)
        features = self.backbone(x)
        
        # Project to shared dimension
        projected = self.projection(features)
        
        return projected

if __name__ == "__main__":
    # Quick test script
    print("Initializing EfficientNetV2Branch...")
    model = EfficientNetV2Branch(embed_dim=512, pretrained=False)
    
    dummy_input = torch.randn(2, 3, 256, 256)
    print(f"Feeding dummy input of shape {dummy_input.shape}...")
    
    output = model(dummy_input)
    print(f"Output shape: {output.shape} (Expected: [2, 512])")
    
    # Test backward pass to verify hooks
    print("Testing backward pass for GradCAM hooks...")
    loss = output.sum()
    loss.backward()
    
    grads = model.get_gradients()
    acts = model.get_activations()
    
    print(f"Gradients captured: {grads is not None}")
    if grads is not None:
        print(f"Gradient shape: {grads.shape}")
        print(f"Activation shape: {acts.shape}")
