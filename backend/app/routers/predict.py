"""
predict.py — API router for /predict and /health endpoints.
Week 2: returns mock data. Week 8: replaced with real model inference.
"""

import base64
import io
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.predict import PredictionResponse, HealthResponse

router = APIRouter()

# Valid lesion localizations from HAM10000
VALID_LOCALIZATIONS = {
    'back', 'lower extremity', 'trunk', 'upper extremity',
    'abdomen', 'face', 'hand', 'foot', 'scalp',
    'neck', 'ear', 'genital', 'acral'
}

VALID_SEX = {'male', 'female'}


def _make_fake_gradcam_base64() -> str:
    """
    Returns a small red PNG as base64 — placeholder for real GradCAM heatmap.
    Frontend uses this to test the GradCAMViewer component.
    """
    # 10x10 red PNG in base64 (hardcoded — no image library needed)
    red_png_b64 = (
        "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8"
        "z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg=="
    )
    return red_png_b64


@router.get("/health", response_model=HealthResponse)
def health_check():
    """Returns API health status."""
    return HealthResponse(status="ok", model_loaded=False)
    # model_loaded=False because real model not loaded yet


@router.post("/predict", response_model=PredictionResponse)
async def predict(
    image:        UploadFile = File(...,  description="Dermoscopic image (JPEG/PNG)"),
    age:          int        = Form(...,  description="Patient age 1-120"),
    sex:          str        = Form(...,  description="Patient sex: male or female"),
    localization: str        = Form(...,  description="Anatomical lesion location"),
):
    """
    Accepts dermoscopic image + patient metadata.
    Returns predicted lesion class, confidence, all 7 probabilities, GradCAM heatmap.
    """

    # ── Validation ──────────────────────────────────────────────────────────

    # Check image type
    if image.content_type not in {"image/jpeg", "image/png"}:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{image.content_type}'. Only JPEG and PNG accepted."
        )

    # Read image bytes and check size
    contents = await image.read()
    if len(contents) > 10 * 1024 * 1024:    # 10MB limit
        raise HTTPException(
            status_code=413,
            detail=f"File size {len(contents)/(1024*1024):.1f}MB exceeds 10MB limit."
        )

    # Validate age
    if not (1 <= age <= 120):
        raise HTTPException(
            status_code=400,
            detail=f"Age {age} is invalid. Must be between 1 and 120."
        )

    # Validate sex
    if sex.lower() not in VALID_SEX:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sex '{sex}'. Must be 'male' or 'female'."
        )

    # Validate localization
    if localization.lower() not in VALID_LOCALIZATIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid localization '{localization}'. Must be one of: {sorted(VALID_LOCALIZATIONS)}"
        )

    # ── Mock response (replace with real inference in Week 8) ───────────────

    print(f"[MOCK] Received image: {image.filename} ({len(contents)/1024:.1f} KB)")
    print(f"[MOCK] Patient: age={age}, sex={sex}, location={localization}")

    mock_response = PredictionResponse(
        predicted_class="MEL",
        confidence=0.87,
        probabilities={
            "MEL":   0.87,
            "NV":    0.06,
            "BKL":   0.03,
            "BCC":   0.02,
            "AKIEC": 0.01,
            "VASC":  0.005,
            "DF":    0.005,
        },
        gradcam_image=_make_fake_gradcam_base64(),
    )

    return mock_response
