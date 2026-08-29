import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.cuda.amp import autocast, GradScaler
from tqdm import tqdm
from pathlib import Path
from sklearn.metrics import accuracy_score, f1_score

# Imports from our modules
from src.dataset import get_splits
from src.branches.cnn import EfficientNetV2Branch

# Note: Once Person C implements `SkinFuseNetModel` and `FocalLoss`, we will import them here.
# from src.model import SkinFuseNetModel
# from src.loss import FocalLoss

class MockSkinFuseNetModel(nn.Module):
    """
    A temporary mock model using ONLY the CNN branch to allow Person A to test the pipeline 
    before Person B and C finish the ViT, BERT, and Fusion layers.
    """
    def __init__(self, num_classes=7):
        super().__init__()
        self.cnn = EfficientNetV2Branch(embed_dim=512)
        # Directly project CNN embedding to classes for testing
        self.classifier = nn.Linear(512, num_classes)
        
    def forward(self, image, input_ids=None, attention_mask=None):
        # Ignore text inputs for this mock
        features = self.cnn(image)
        return self.classifier(features)

def train_one_epoch(model, dataloader, optimizer, criterion, scaler, device):
    model.train()
    running_loss = 0.0
    all_preds = []
    all_labels = []
    
    progress_bar = tqdm(dataloader, desc="Training")
    
    for batch in progress_bar:
        images = batch['image'].to(device)
        input_ids = batch['input_ids'].to(device)
        attention_mask = batch['attention_mask'].to(device)
        labels = batch['label'].to(device)
        
        optimizer.zero_grad()
        
        # Mixed Precision Forward pass
        with autocast():
            # In final version: outputs = model(images, input_ids, attention_mask)
            outputs = model(images, input_ids, attention_mask)
            loss = criterion(outputs, labels)
            
        # Mixed Precision Backward pass
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()
        
        running_loss += loss.item()
        
        # Metrics
        preds = torch.argmax(outputs, dim=1)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())
        
        progress_bar.set_postfix({'loss': loss.item()})
        
    epoch_loss = running_loss / len(dataloader)
    epoch_acc = accuracy_score(all_labels, all_preds)
    epoch_f1 = f1_score(all_labels, all_preds, average='macro')
    
    return epoch_loss, epoch_acc, epoch_f1

def validate(model, dataloader, criterion, device):
    model.eval()
    running_loss = 0.0
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for batch in tqdm(dataloader, desc="Validation"):
            images = batch['image'].to(device)
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['label'].to(device)
            
            with autocast():
                outputs = model(images, input_ids, attention_mask)
                loss = criterion(outputs, labels)
                
            running_loss += loss.item()
            preds = torch.argmax(outputs, dim=1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            
    epoch_loss = running_loss / len(dataloader)
    epoch_acc = accuracy_score(all_labels, all_preds)
    epoch_f1 = f1_score(all_labels, all_preds, average='macro')
    
    return epoch_loss, epoch_acc, epoch_f1

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Train SkinFuseNet")
    parser.add_argument("--csv", type=str, default="data/raw/HAM10000_metadata.csv", help="Path to metadata CSV")
    parser.add_argument("--img_dir", type=str, default="data/processed/clahe", help="Path to processed images")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-4)
    args = parser.parse_args()
    
    # 1. Setup Device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # 2. Setup DataLoaders
    # Note: Requires the CSV file to exist!
    print("Initializing DataLoaders...")
    try:
        train_loader, val_loader, test_loader = get_splits(args.csv, args.img_dir, batch_size=args.batch_size)
    except FileNotFoundError as e:
        print(f"Error loading dataset: {e}")
        print(f"Make sure you have placed the HAM10000 metadata CSV at: {args.csv}")
        return
        
    # 3. Setup Model
    print("Initializing Model...")
    model = MockSkinFuseNetModel(num_classes=7).to(device)
    
    # 4. Optimizer, Scheduler, Loss, Scaler
    optimizer = optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)
    
    # Fallback to standard CrossEntropy until Person C builds FocalLoss
    criterion = nn.CrossEntropyLoss()
    
    scaler = GradScaler()
    
    # 5. Training Loop
    os.makedirs('checkpoints', exist_ok=True)
    best_val_f1 = 0.0
    
    for epoch in range(1, args.epochs + 1):
        print(f"\nEpoch {epoch}/{args.epochs}")
        
        train_loss, train_acc, train_f1 = train_one_epoch(model, train_loader, optimizer, criterion, scaler, device)
        val_loss, val_acc, val_f1 = validate(model, val_loader, criterion, device)
        
        scheduler.step()
        
        print(f"Train - Loss: {train_loss:.4f} | Acc: {train_acc:.4f} | F1: {train_f1:.4f}")
        print(f"Val   - Loss: {val_loss:.4f} | Acc: {val_acc:.4f} | F1: {val_f1:.4f}")
        
        # Save Best Checkpoint
        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            checkpoint_path = f"checkpoints/best_model.pth"
            torch.save(model.state_dict(), checkpoint_path)
            print(f"🌟 Saved new best model with Val F1: {best_val_f1:.4f}")

if __name__ == "__main__":
    main()
