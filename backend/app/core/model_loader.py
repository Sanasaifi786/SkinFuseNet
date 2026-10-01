import os
import torch
import logging

logger = logging.getLogger("uvicorn.info")
MODEL_VERSION = "v3"

# Possible paths where the trained model weights might reside
CHECKPOINT_PATHS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../ml/models/skinfusenet_v3.pt")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../ml/models/best_model_v3.pth")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models/skinfusenet_v3.pt")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models/best_model_v3.pth")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../ml/models/best_model.pth")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../ml/models/skin_fuse_net.pt")),
    os.path.abspath("best_model.pth"),
    os.path.abspath("model.pt"),
]

def get_device() -> torch.device:
    """Returns CUDA if GPU available, otherwise CPU."""
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")

def load_trained_model(weights_path: str = None):
    """
    Safely loads the trained PyTorch / TorchScript model into memory.
    The private v3 artifact is intentionally ignored by Git and must be
    present in one of the local checkpoint paths above.
    """
    device = get_device()
    candidate_paths = [weights_path] if weights_path else CHECKPOINT_PATHS

    for path in candidate_paths:
        if path and os.path.exists(path):
            try:
                logger.info(f"🔄 Loading model from: {path} on {device}...")
                
                # Check if it's a TorchScript model (.pt) or standard weights (.pth)
                if path.endswith(".pt"):
                    model = torch.jit.load(path, map_location=device)
                else:
                    # If standard PyTorch state dict, load weights into memory
                    # (TorchScript or custom model class)
                    model = torch.load(path, map_location=device, weights_only=False)
                
                model.eval()
                logger.info(f"✅ Model loaded successfully from {path} onto {device}!")
                return model
            except Exception as e:
                logger.error(f"❌ Failed to load checkpoint from {path}: {e}")

    logger.warning("No trained %s checkpoint found; predictions are unavailable.", MODEL_VERSION)
    return None
