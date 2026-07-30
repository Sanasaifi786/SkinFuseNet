"""
predict.py — Pydantic models for /predict request and response.
These define the exact shape of data in and out of the API.
"""

from pydantic import BaseModel
from typing import Dict


class PredictionResponse(BaseModel):
    """
    Response returned by POST /predict.
    All fields must be present — frontend depends on every one of them.
    """
    predicted_class: str           # e.g. "MEL", "NV", "BKL"
    confidence: float              # 0.0 to 1.0
    probabilities: Dict[str, float]  # all 7 classes with their probabilities
    gradcam_image: str             # base64 encoded PNG string


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
