import torch
from transformers import BertTokenizer, BertModel
import torch.nn as nn

class MetadataTokenizer:
    def __init__(self):
        """
        Initializes the BERT tokenizer. We use 'bert-base-uncased' which means
        all words are converted to lowercase before tokenization.
        """
        # We download the standard BERT dictionary from HuggingFace
        self.tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')

    def tokenize(self, age, sex, localization):
        """
        Converts raw patient metadata into padded/truncated token tensors.
        """
        # 1. Convert the data into a normal English sentence (the prompt)
        prompt = f"Patient: {age}-year-old {sex}. Lesion location: {localization}."
        
        # 2. Convert the sentence into numbers using the strict rules
        tokens = self.tokenizer(
            prompt,
            padding='max_length',  # Pad with 0s if shorter than 128
            max_length=128,        # Always exactly 128 numbers long
            truncation=True,       # Cut it off if longer than 128
            return_tensors='pt'    # 'pt' stands for PyTorch tensor
        )
        
        return tokens

# Small test block so you can run this file directly and see what happens!
if __name__ == "__main__":
    print("Loading tokenizer...")
    tokenizer = MetadataTokenizer()
    
    print("\nTokenizing a 45-year-old male with a lesion on the back...")
    result = tokenizer.tokenize(45, "male", "back")
    
    print("\nHere are the actual token IDs (notice the 0s at the end for padding!):")
    print(result['input_ids'])
    
    print("\nHere is the Attention Mask (1 means real word, 0 means padding):")
    print(result['attention_mask'])


class BertMetadataBranch(nn.Module):
    def __init__(self, embed_dim=512, pretrained=True, freeze_bert=True):
        """
        BERT encoder branch for patient metadata feature extraction.
        Args:
            embed_dim (int): Target shared embedding dimension (default 512).
            pretrained (bool): Whether to load pretrained weights from HuggingFace.
            freeze_bert (bool): Whether to freeze all BERT layers at initialization.
        """
        super().__init__()
        # 1. Load the core BERT backbone neural network (12 Transformer Layers)
        if pretrained:
            self.bert = BertModel.from_pretrained('bert-base-uncased')
        else:
            from transformers import BertConfig
            config = BertConfig()
            self.bert = BertModel(config)
        self.bert_hidden_size = self.bert.config.hidden_size  # 768 for bert-base
        # 2. Freeze BERT parameters so training on 10k images doesn't ruin the weights
        if freeze_bert:
            self.freeze_backbone()
        # 3. Projection layer: projects 768-dim [CLS] embedding to shared embed_dim (512)
        self.projection = nn.Sequential(
            nn.Linear(self.bert_hidden_size, embed_dim),
            nn.LayerNorm(embed_dim),
            nn.Dropout(p=0.2)
        )
    def freeze_backbone(self):

        """Freezes all weights in the BERT backbone."""
        for param in self.bert.parameters():
            param.requires_grad = False

    def unfreeze_backbone(self):

        """Unfreezes all weights in the BERT backbone for end-to-end fine-tuning."""
        for param in self.bert.parameters():
            param.requires_grad = True

    def unfreeze_last_n_layers(self, n=2):

        """
        Unfreezes the pooler and the top n transformer encoder layers.
        Used after initial warm-up epochs in the training loop.
        """
        if hasattr(self.bert, 'pooler') and self.bert.pooler is not None:
            for param in self.bert.pooler.parameters():
                param.requires_grad = True
        num_layers = len(self.bert.encoder.layer)
        for i in range(num_layers - n, num_layers):
            for param in self.bert.encoder.layer[i].parameters():
                param.requires_grad = True

    def forward(self, input_ids, attention_mask):
        """
        Forward pass: takes token IDs and attention mask, returns [B, embed_dim].
        """
        # Pass tokens through the 12 Transformer layers
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        # Squeeze out the [CLS] token at position 0: shape [B, 768]
        cls_token_embedding = outputs.last_hidden_state[:, 0, :]
        # Project from 768 to 512
        embedding = self.projection(cls_token_embedding)
        return embedding


if __name__ == "__main__":

    print("=" * 60)
    print("Testing Complete BertMetadataBranch (Tokenizer + Neural Net)...")
    print("=" * 60)

    # 1. Initialize Tokenizer & Model
    tokenizer = MetadataTokenizer()
    model = BertMetadataBranch(embed_dim=512, pretrained=True, freeze_bert=True)
    model.eval()

    # 2. Simulate a batch of 2 clinical samples
    sample_1 = tokenizer.tokenize(68, "female", "lower extremity")
    sample_2 = tokenizer.tokenize(24, "male", "back")
    batch_input_ids = torch.cat([sample_1['input_ids'], sample_2['input_ids']], dim=0)
    batch_attention_mask = torch.cat([sample_1['attention_mask'], sample_2['attention_mask']], dim=0)
    print(f"\nBatch input_ids shape:      {batch_input_ids.shape} (Expected: [2, 128])")
    print(f"Batch attention_mask shape: {batch_attention_mask.shape} (Expected: [2, 128])")

    # 3. Forward Pass through the Neural Network
    with torch.no_grad():
        output = model(batch_input_ids, batch_attention_mask)
    print(f"Output embedding shape:     {output.shape} (Expected: [2, 512])")
    assert output.shape == (2, 512), f"Error: Expected [2, 512], but got {output.shape}"

    # 4. Parameter Count Check
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    frozen_params = total_params - trainable_params
    print("-" * 60)
    print(f"Total Parameters:     {total_params:,}")
    print(f"Frozen Parameters:    {frozen_params:,} (BERT Backbone)")
    print(f"Trainable Parameters: {trainable_params:,} (Projection Layer Only)")
    print("-" * 60)
    print("✅ BertMetadataBranch successfully tested and verified!")
