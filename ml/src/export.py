import sys
import os
from pathlib import Path
import torch
import torch.nn as nn

ml_dir = Path(__file__).resolve().parents[1]
if str(ml_dir) not in sys.path:
    sys.path.insert(0, str(ml_dir))

from src.model import SkinFuseNetModel


def export_to_torchscript(
    checkpoint_path=None,
    output_path="backend/models/skinfusenet.pt",
    device="cpu"
):
    """
    Exports SkinFuseNet model into a production-ready TorchScript (.pt) bundle.
    
    Args:
        checkpoint_path (str, optional): Path to trained .pth state dict. If None,
        exports architecture with initialized weights.
        output_path (str): Target output file destination.
        device (str): Device to compile the model on ('cpu' recommended for backend serving).
    """
    print("=" * 65)
    print("SkinFuseNet Production TorchScript Exporter")
    print("=" * 65)

    target_device = torch.device(device)
    print(f"[1/5] Target inference device: {target_device}")

    print("[2/5] Instantiating SkinFuseNet architecture...")
    model = SkinFuseNetModel(num_classes=7, embed_dim=512, pretrained=False)

    if checkpoint_path and os.path.exists(checkpoint_path):
        print(f"      Loading weights from: {checkpoint_path}")
        state_dict = torch.load(checkpoint_path, map_location=target_device)
        if "model_state_dict" in state_dict:
            state_dict = state_dict["model_state_dict"]
        model.load_state_dict(state_dict)
        print("      Checkpoint weights successfully loaded!")
    else:
        print("      [NOTE] No trained checkpoint specified. Exporting initialized architecture for pipeline verification.")

    model.to(target_device)
    model.eval()  # Crucial: Disables Dropout and freezes BatchNorm/LayerNorm statistics!

    # Create canonical example inputs (Batch size = 1 for serving single patient requests)
    print("[3/5] Generating example tensors for JIT Tracing (Batch size = 1)...")
    example_image = torch.randn(1, 3, 256, 256, dtype=torch.float32, device=target_device)
    example_input_ids = torch.randint(0, 1000, (1, 128), dtype=torch.int64, device=target_device)
    example_attention_mask = torch.ones(1, 128, dtype=torch.int64, device=target_device)
    example_inputs = (example_image, example_input_ids, example_attention_mask)

    #  Perform JIT Tracing
    print("[4/5] Tracing computational graph with torch.jit.trace...")
    with torch.no_grad():
        traced_model = torch.jit.trace(model, example_inputs)

    #  Verify and Save
    print(f"[5/5] Verifying and saving serialized model...")
    # Ensure destination directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    traced_model.save(output_path)
    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"      Saved TorchScript model to: {output_path} ({file_size_mb:.2f} MB)")

    #  Independence Test: Load the saved .pt file with pure torch.jit (No source code needed!)
    print("\n--- Verifying Standalone Loading (Simulating Backend Server) ---")
    loaded_model = torch.jit.load(output_path, map_location=target_device)
    loaded_model.eval()

    with torch.no_grad():
        original_output = model(*example_inputs)
        traced_output = loaded_model(*example_inputs)

    # Check numeric parity
    max_diff = torch.max(torch.abs(original_output - traced_output)).item()
    print(f"  Maximum absolute difference between Python model and TorchScript: {max_diff:.8e}")
    assert max_diff < 1e-5, f"Warning: Numerical discrepancy detected ({max_diff})!"

    print(f"  Output predictions shape: {traced_output.shape} (Expected: [1, 7])")
    print("[SUCCESS] Model export passed all verification checks!")
    print("=" * 65)
    return output_path


if __name__ == "__main__":
    # Test export
    export_to_torchscript(output_path="backend/models/skinfusenet.pt")
