import torch
from transformers import BertTokenizer

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
