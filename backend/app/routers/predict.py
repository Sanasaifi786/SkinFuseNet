"""
predict.py — API router for /predict and /health endpoints.
Week 2: returns mock data. Week 8: replaced with real model inference.
"""


from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.predict import PredictionResponse, HealthResponse
from app.services.inference import run_inference

router = APIRouter()

# Valid lesion localizations from HAM10000
VALID_LOCALIZATIONS = {
    'back', 'lower extremity', 'trunk', 'upper extremity',
    'abdomen', 'face', 'hand', 'foot', 'scalp',
    'neck', 'ear', 'genital', 'acral'
}

VALID_SEX = {'male', 'female'}





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

    # ── Inference (Week 8) ──────────────────────────────────────────────────

    # Pass validated data to inference service
    result = run_inference(contents, age, sex, localization)
    return result
