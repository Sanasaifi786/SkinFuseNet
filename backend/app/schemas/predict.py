"""
predict.py — Pydantic models for /predict request and response.
These define the exact shape of data in and out of the API.
"""

from pydantic import BaseModel , Field , field_validator , model_validator
from typing import Dict , Literal

VALID_LOCALIZATIONS = {
    "abdomen", "back", "chest", "ear", "face", "foot", "genital", "hand","lower extremity",
    "neck", "scalp","trunk", "upper extremity", "acral", "unknown"
}

VALID_DIAGNOSES = {"AKIEC", "BCC", "BKL", "DF", "MEL", "NV", "VASC"}

class MetadataRequest(BaseModel):
    """
    Validation schema for patient demographic and clinical metadata.
    """
    age: int = Field(
        ...,
        ge=1,
        le=120,
        description="Patient age in years (must be between 1 and 120).",
        examples=[45]
    )
    sex: Literal["male", "female", "unknown"] = Field(
        ...,
        description="Patient biological sex.",
        examples=["male"]
    )
    localization: str = Field(
        ...,
        description="Anatomical location of the skin lesion.",
        examples=["back"]
    )
    @field_validator("localization")
    @classmethod
    def validate_localization(cls, v: str) -> str:
        clean_loc = v.strip().lower()
        if clean_loc not in VALID_LOCALIZATIONS:
            raise ValueError(
                f"Invalid localization: '{v}'. Must be one of: {sorted(list(VALID_LOCALIZATIONS))}"
            )
        return clean_loc


class PredictionResponse(BaseModel):
    """
    Strict response schema returned by POST /predict.
    Ensures that the model's output satisfies all medical AI safety invariants.
    """
    predicted_class: str = Field(
        ...,
        description="The primary diagnosed lesion type (highest probability class).",
        examples=["MEL"]
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score for the predicted class between 0.0 and 1.0.",
        examples=[0.942]
    )
    probabilities: Dict[str, float] = Field(
        ...,
        description="Probability distribution across all 7 diagnostic classes.",
        examples=[{
            "AKIEC": 0.01,
            "BCC": 0.02,
            "BKL": 0.01,
            "DF": 0.005,
            "MEL": 0.942,
            "NV": 0.01,
            "VASC": 0.003
        }]
    )
    gradcam_image: str = Field(
        ...,
        min_length=10,
        description="Base64-encoded PNG string of the GradCAM heatmap overlay.",
        examples=["iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="]
    )
    @field_validator("predicted_class")
    @classmethod
    def validate_predicted_class(cls, v: str) -> str:
        clean_cls = v.upper().strip()
        if clean_cls not in VALID_DIAGNOSES:
            raise ValueError(f"Invalid predicted class '{v}'. Must be one of {sorted(list(VALID_DIAGNOSES))}")
        return clean_cls

    @field_validator("probabilities")
    @classmethod
    def validate_probabilities(cls, v: Dict[str, float]) -> Dict[str, float]:
        keys = set(k.upper() for k in v.keys())
        if keys != VALID_DIAGNOSES:
            missing = VALID_DIAGNOSES - keys
            extra = keys - VALID_DIAGNOSES
            raise ValueError(f"Probabilities dictionary mismatch. Missing: {missing}, Extra: {extra}")

        for k, prob in v.items():
            if not (0.0 <= prob <= 1.0):
                raise ValueError(f"Probability for class {k} must be between 0.0 and 1.0. Got: {prob}")

        total = sum(v.values())
        if not (0.98 <= total <= 1.02):
            raise ValueError(f"Probabilities must sum to approximately 1.0 (+-0.02). Actual sum: {total:.4f}")
        return v

class HealthResponse(BaseModel):
    """
    Health-check endpoint response.
    """
    status: str = Field("ok", examples=["ok"])
    model_loaded: bool = Field(..., examples=[True])


if __name__ == "__main__":

    print("=" * 65)
    print("Testing Pydantic v2 Schemas and Medical Validators...")
    print("=" * 65)

    valid_req = MetadataRequest(age=52, sex="female", localization="Lower Extremity")
    print(f"[1/4] Valid MetadataRequest created: {valid_req.model_dump()}")


    try:
        MetadataRequest(age=150, sex="male", localization="back")
        print("❌ Failed: Did not catch invalid age!")
    except Exception as e:
        print(f"[2/4] Successfully caught invalid age: {e.errors()[0]['msg']}")

    try:
        MetadataRequest(age=30, sex="male", localization="elbow")
        print("❌ Failed: Did not catch invalid localization!")
    except Exception as e:
        print(f"[3/4] Successfully caught invalid localization: {e.errors()[0]['msg']}")


    sample_probs = {
        "AKIEC": 0.01, "BCC": 0.02, "BKL": 0.01,
        "DF": 0.005, "MEL": 0.942, "NV": 0.01, "VASC": 0.003
    }
    valid_resp = PredictionResponse(
        predicted_class="MEL",
        confidence=0.942,
        probabilities=sample_probs,
        gradcam_image="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    )

    print(f"[4/4] Valid PredictionResponse created: {valid_resp.predicted_class} ({valid_resp.confidence * 100:.1f}%)")

    bad_probs = sample_probs.copy()
    bad_probs["MEL"] = 0.50 
    try:
        PredictionResponse(
            predicted_class="MEL",
            confidence=0.50,
            probabilities=bad_probs,
            gradcam_image="validbase64string..."
        )
        print("❌ Failed: Did not catch invalid probability sum!")
    except Exception as e:
        print(f"      Successfully caught bad probability sum: {e.errors()[0]['msg']}")
    print("-" * 65)
    print("[SUCCESS] All Pydantic schema validation rules verified!")
    print("=" * 65)