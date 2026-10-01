import torch
import torch.nn.functional as F
from fastapi import HTTPException
from transformers import BertTokenizer
from app.services.preprocess import preprocess_image
from app.core.model_loader import MODEL_VERSION, load_trained_model

CLASS_NAMES = ("AKIEC", "BCC", "BKL", "DF", "MEL", "NV", "VASC")

_model = None
_tokenizer = None

def get_model():
    global _model
    if _model is None:
        _model = load_trained_model()
    return _model


def get_metadata_tokens(age: int, sex: str, localization: str):
    global _tokenizer
    if _tokenizer is None:
        _tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
    prompt = f"Patient: {age}-year-old {sex}. Lesion location: {localization}."
    return _tokenizer(
        prompt,
        padding="max_length",
        max_length=128,
        truncation=True,
        return_tensors="pt",
    )

def run_inference(image_bytes: bytes, age: int, sex: str, localization: str) -> dict:
    image_tensor = preprocess_image(image_bytes)
    model = get_model()

    if model is None:
        raise HTTPException(
            status_code=503,
            detail=f"SkinFuseNet {MODEL_VERSION} model is unavailable. Add the private checkpoint before predicting.",
        )

    tokens = get_metadata_tokens(age, sex, localization)
    with torch.no_grad():
        logits = model(image_tensor, tokens["input_ids"], tokens["attention_mask"])
        probabilities = F.softmax(logits, dim=1)[0]
        confidence, predicted_idx = torch.max(probabilities, dim=0)
        winner = CLASS_NAMES[predicted_idx.item()]
        confidence = round(confidence.item(), 4)
        probs = {
            name: round(prob.item(), 4) 
            for name, prob in zip(CLASS_NAMES, probabilities)
        }

    return {
        "predicted_class": winner,
        "confidence": confidence,
        "probabilities": probs,
        "gradcam_image": None
    }
