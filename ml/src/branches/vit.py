import torch
import torch.nn as nn
import timm

class SwinTransformerBranch(nn.Module):
    def __init__(self, embedding_dim=512):
        super().__init__()
        
        # FIX: By adding num_classes=0, timm automatically deletes the 
        # classification head AND flattens the grid for us!
        self.swin = timm.create_model('swinv2_tiny_window16_256', pretrained=True, num_classes=0)
        
        # We can now ask timm exactly how many features it outputs by default
        in_features = self.swin.num_features 
        
        # We still keep our custom projector just in case we ever want to 
        # change our embedding_dim to something other than 512 later!
        self.projector = nn.Linear(in_features, embedding_dim)
        
    def forward(self, x):
        features = self.swin(x)
        embedding = self.projector(features)
        return embedding

if __name__ == "__main__":
    print("Loading Swin Transformer...")
    model = SwinTransformerBranch(embedding_dim=512)
    
    print("Creating a fake batch of 2 blank images (256x256 pixels)...")
    fake_images = torch.randn(2, 3, 256, 256) 
    
    print("Passing images through the Vision Transformer...")
    output = model(fake_images)
    
    print(f"Success! Output shape is: {output.shape}")
