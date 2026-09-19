import io
import cv2
import numpy as np
from PIL import Image
import torch
from torchvision import transforms


def apply_clahe(image_np: np.ndarray, clip_limit: float = 2.0, tile_grid_size: tuple = (8, 8)) -> np.ndarray:
    """
    Applies Contrast Limited Adaptive Histogram Equalization (CLAHE)
    strictly to the Lightness (L) channel in LAB color space.
    
    Args:
        image_np (np.ndarray): RGB image array of shape [H, W, 3] with dtype uint8.
        clip_limit (float): Threshold for contrast limiting. Default: 2.0.
        tile_grid_size (tuple): Size of grid for histogram equalization. Default: (8, 8).
        
    Returns:
        np.ndarray: Enhanced RGB image array with preserved color fidelity.
    """
    # 1. Convert RGB to LAB color space
    lab = cv2.cvtColor(image_np, cv2.COLOR_RGB2LAB)

    # 2. Split into L, A, and B channels
    l_channel, a_channel, b_channel = cv2.split(lab)

    # 3. Apply CLAHE only to the Lightness channel
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    l_enhanced = clahe.apply(l_channel)

    # 4. Merge enhanced Lightness with original chromatic channels
    enhanced_lab = cv2.merge((l_enhanced, a_channel, b_channel))

    # 5. Convert back to RGB color space
    enhanced_rgb = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2RGB)

    return enhanced_rgb


def preprocess_image(image_bytes: bytes) -> torch.Tensor:
    """
    Preprocesses raw image bytes uploaded to the API into a normalized 4D tensor
    ready for model inference.
    
    Pipeline:
        Bytes -> PIL Image -> RGB NumPy -> LAB CLAHE -> PIL -> 256x256 -> Tensor -> Normalize -> [1, 3, 256, 256]
        
    Args:
        image_bytes (bytes): Binary contents of uploaded image file.
        
    Returns:
        torch.Tensor: Preprocessed image tensor of shape [1, 3, 256, 256] and dtype float32.
    """
    if not image_bytes:
        raise ValueError("Image bytes cannot be empty.")

    try:
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise ValueError(f"Failed to decode image bytes: {e}")

    img_np = np.array(pil_image)

    enhanced_np = apply_clahe(img_np, clip_limit=2.0, tile_grid_size=(8, 8))

    enhanced_pil = Image.fromarray(enhanced_np)

    inference_transforms = transforms.Compose([
        transforms.Resize((256, 256), interpolation=transforms.InterpolationMode.BILINEAR),
        transforms.ToTensor(),  # Converts [0, 255] to [0.0, 1.0] float32 tensor
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    image_tensor = inference_transforms(enhanced_pil)

    image_tensor = image_tensor.unsqueeze(0)

    return image_tensor


if __name__ == "__main__":
    print("=" * 65)
    print("Testing Inference Preprocessing Service...")
    print("=" * 65)

    dummy_pil = Image.new("RGB", (600, 450), color=(180, 100, 80))
    buffer = io.BytesIO()
    dummy_pil.save(buffer, format="JPEG")
    fake_upload_bytes = buffer.getvalue()

    print(f"Simulated uploaded file size: {len(fake_upload_bytes):,} bytes")

    tensor_out = preprocess_image(fake_upload_bytes)

    print(f"Output Tensor Shape: {tensor_out.shape} (Expected: [1, 3, 256, 256])")
    print(f"Output Tensor Dtype: {tensor_out.dtype} (Expected: torch.float32)")
    print(f"Output Value Range:  [{tensor_out.min().item():.2f}, {tensor_out.max().item():.2f}]")

    assert tensor_out.shape == (1, 3, 256, 256), "Shape mismatch!"
    assert tensor_out.dtype == torch.float32, "Dtype mismatch!"
    assert not torch.isnan(tensor_out).any(), "Found NaN values in tensor!"

    print("-" * 65)
    print("[SUCCESS] preprocess_image() verified and ready for inference.py!")
    print("=" * 65)
