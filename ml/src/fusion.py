import torch
import torch.nn as nn

class CrossAttentionFusion(nn.Module):
    def __init__(self, embedding_dim=512, num_heads=8):
        super().__init__()
        
        self.cross_attn = nn.MultiheadAttention(embed_dim=embedding_dim, num_heads=num_heads, batch_first=True)
        
        self.norm = nn.LayerNorm(embedding_dim)
        
    def forward(self, cnn_features, vit_features, metadata_features):
        combined_image = cnn_features + vit_features
        
        combined_image = combined_image.unsqueeze(1)    
        metadata_features = metadata_features.unsqueeze(1) 
        
        attn_output, _ = self.cross_attn(
            query=combined_image, 
            key=metadata_features, 
            value=metadata_features
        )
        
        fused = self.norm(combined_image + attn_output)
        
        return fused.squeeze(1)

# Test block
if __name__ == "__main__":
    fusion = CrossAttentionFusion()
    fake_cnn, fake_vit, fake_bert = torch.randn(2, 512), torch.randn(2, 512), torch.randn(2, 512)
    output = fusion(fake_cnn, fake_vit, fake_bert)
    print(f"Success! Output shape: {output.shape}")
