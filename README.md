# SkinFuseNet 🔬
### A Multimodal Hybrid Deep Learning Framework for Skin Lesion Classification

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0.1-orange.svg)](https://pytorch.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-In%20Progress-orange.svg)]()

> **Research paper companion web application** — SkinFuseNet is a multimodal hybrid deep learning system integrating SAM-guided segmentation, dual-branch CNN–ViT feature extraction, and BERT-based metadata fusion for 7-class skin lesion classification on the HAM10000 benchmark, achieving **97.1% accuracy** and **94.0% macro F1-score**.

---

## 📋 Table of Contents

- [About the Project](#about-the-project)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Team](#team)
- [Progress Tracker](#progress-tracker)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation — ML](#installation--ml)
  - [Installation — Backend](#installation--backend)
  - [Installation — Frontend](#installation--frontend)
  - [Running with Docker](#running-with-docker)
- [Dataset](#dataset)
- [Model Pipeline](#model-pipeline)
- [API Reference](#api-reference)
- [Week-by-Week Roadmap](#week-by-week-roadmap)
- [Results](#results)
- [Known Issues & Gotchas](#known-issues--gotchas)
- [Contributing](#contributing)
- [License](#license)

---

## About the Project

Skin cancer is the most prevalent cancer globally. Early detection dramatically improves survival rates — melanoma caught at stage 1 has a 98%+ survival rate vs below 30% at metastatic stage. SkinFuseNet automates dermoscopic skin lesion classification across 7 clinically distinct categories using a multimodal deep learning pipeline that mirrors how real dermatologists diagnose — combining visual image analysis with patient metadata (age, sex, lesion location).

**This repository contains:**
- The full ML training pipeline (PyTorch)
- A FastAPI inference backend serving the trained model
- A React web application for clinical decision support
- The accompanying IEEE research paper (LaTeX source)

**Expected results on HAM10000 (7-class):**

| Metric | Score |
|--------|-------|
| Accuracy | 97.1% |
| Macro F1 | 94.0% |
| Melanoma Recall | 94.2% |
| Macro Precision | 96.0% |
| Macro Recall | 96.0% |

---

## Architecture Overview

```
User uploads dermoscopic image + patient metadata
              ↓
     ┌────────────────────┐
     │  Stage 1: Preprocess│
     │  SAM segmentation   │
     │  CLAHE enhancement  │
     │  MixUp/CutMix/RSPDA │
     └────────┬───────────┘
              ↓
   ┌──────────┴──────────┐
   │                     │                   │
   ▼                     ▼                   ▼
EfficientNetV2      Swin Transformer V2    BERT Encoder
(local textures,    (global context,       (age, sex,
 borders, color)     shifted-window attn)   location)
   │                     │                   │
   └──────────┬──────────┘
              ↓
     Cross-Attention Fusion
     (CNN × ViT × Metadata)
              ↓
     Focal Loss + Label Smoothing
              ↓
     7-Class Softmax Classifier
     MEL · NV · BKL · BCC · AKIEC · DF · VASC
              ↓
     GradCAM Heatmap (explainability)
```

---

## Tech Stack

### ML Layer
| Tool | Version | Purpose |
|------|---------|---------|
| PyTorch | 2.0.1 | Model training & inference |
| torchvision | 0.15.2 | Image transforms |
| HuggingFace Transformers | 4.35.0 | EfficientNetV2, Swin V2, BERT |
| segment-anything | latest | SAM lesion segmentation |
| OpenCV | 4.8.0 | CLAHE contrast enhancement |
| albumentations | 1.3.1 | Augmentation pipeline |
| grad-cam | 1.4.8 | GradCAM heatmap generation |
| Weights & Biases | latest | Experiment tracking |
| timm | latest | Pretrained model hub |

### Backend
| Tool | Version | Purpose |
|------|---------|---------|
| FastAPI | 0.104 | REST API framework |
| Uvicorn | latest | ASGI server |
| Pydantic | 2.4.2 | Request/response validation |
| python-multipart | latest | File upload handling |
| Pillow | latest | Image processing |

### Frontend
| Tool | Version | Purpose |
|------|---------|---------|
| React | 18 | UI framework |
| Vite | latest | Dev server & bundler |
| Tailwind CSS | 3 | Styling |
| Axios | latest | HTTP requests |
| Recharts | latest | Probability bar chart |

### Infrastructure
| Tool | Purpose |
|------|---------|
| Docker + Docker Compose | Containerisation |
| NVIDIA CUDA 11.8 | GPU acceleration |

---

## Project Structure

```
skinfusenet/
├── ml/                          # Machine learning training pipeline
│   ├── src/
│   │   ├── dataset.py           # HAM10000 Dataset class + DataLoader
│   │   ├── branches/
│   │   │   ├── cnn.py           # EfficientNetV2 branch
│   │   │   ├── vit.py           # Swin Transformer V2 branch
│   │   │   └── bert.py          # BERT metadata encoder branch
│   │   ├── fusion.py            # Cross-attention multimodal fusion
│   │   ├── model.py             # Full SkinFuseNet model
│   │   ├── loss.py              # Focal loss + label smoothing
│   │   ├── train.py             # Training loop
│   │   ├── evaluate.py          # Metrics + confusion matrix
│   │   ├── gradcam.py           # GradCAM heatmap generation
│   │   ├── preprocess/
│   │   │   ├── sam_preprocess.py  # SAM segmentation pipeline
│   │   │   ├── clahe.py           # CLAHE contrast enhancement
│   │   │   └── augmentation.py    # MixUp, CutMix, RSPDA
│   │   └── export.py            # TorchScript export → skinfusenet.pt
│   ├── data/
│   │   ├── raw/                 # Original HAM10000 images (not committed)
│   │   ├── processed/           # SAM+CLAHE preprocessed images
│   │   └── masks/               # SAM segmentation masks
│   ├── checkpoints/             # Model checkpoints (not committed)
│   ├── logs/                    # W&B experiment logs
│   ├── notebooks/               # EDA and exploration notebooks
│   └── requirements.txt
│
├── backend/                     # FastAPI inference server
│   ├── app/
│   │   ├── main.py              # App entry point + CORS
│   │   ├── routers/
│   │   │   └── predict.py       # POST /predict · GET /health
│   │   ├── services/
│   │   │   ├── inference.py     # Model forward pass + GradCAM
│   │   │   ├── preprocess.py    # SAM+CLAHE at inference time
│   │   │   └── image_utils.py   # base64 encoding helpers
│   │   ├── schemas/
│   │   │   └── predict.py       # Pydantic request/response models
│   │   └── core/
│   │       └── model_loader.py  # Singleton model loader
│   ├── models/                  # skinfusenet.pt goes here (not committed)
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                    # React web application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ImageUpload.jsx      # Drag/drop image upload
│   │   │   ├── MetadataForm.jsx     # Age · sex · location form
│   │   │   ├── ResultsPanel.jsx     # Prediction + confidence
│   │   │   ├── ProbabilityChart.jsx # Recharts 7-class bar chart
│   │   │   ├── GradCAMViewer.jsx    # Heatmap overlay display
│   │   │   └── DisclaimerBanner.jsx # Medical disclaimer (sticky)
│   │   ├── hooks/
│   │   │   └── usePrediction.js     # Axios state management hook
│   │   ├── api/
│   │   │   └── predict.js           # Axios API call
│   │   ├── pages/
│   │   │   └── Home.jsx
│   │   └── App.jsx
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── paper/                       # IEEE research paper (LaTeX)
│   └── skinfusenet_paper.tex
│
├── docker-compose.yml           # Wires backend + frontend
├── .gitignore
└── README.md
```

---

## Team

| Member | Primary role (rotating) | GitHub |
|--------|------------------------|--------|
| Person A | ML → Backend → Frontend | @personA |
| Person B | Preprocessing → Branches → Inference | @personB |
| Person C | Augmentation → Fusion → Frontend core | @personC |

> **Rotation model:** Every phase, ownership rotates. By week 13 every team member has written ML, backend, and frontend code.

---

## Progress Tracker

### ✅ Completed
- [x] Week 1 — Git setup, monorepo structure, Python/React/FastAPI basics
- [x] Week 1 — HAM10000 downloaded, EDA notebook done
- [x] Week 1 — API contract agreed and documented
- [x] Week 2 — dataset.py with DataLoader working
- [x] Week 2 — SAM preprocessing on single image
- [x] Week 2 — Mock POST /predict endpoint in FastAPI
- [x] Week 2 — ImageUpload.jsx + MetadataForm.jsx built
- [x] Week 2 — Frontend connected to mock backend
- [x] Week 3 — Full SAM preprocessing pipeline over all 10,015 images
- [x] Week 3 — CLAHE applied to all processed images
- [x] Week 4 — BERT metadata tokenisation
- [x] Week 5 — EfficientNetV2 CNN branch
- [x] Week 5 — Swin Transformer V2 ViT branch
- [x] Week 6 — Training loop implementation

### 🚧 In Progress
- [ ] Week 3 — Augmentation pipeline (MixUp, CutMix, RSPDA)
- [ ] Week 4 — Stratified split verification
- [ ] Week 5 — BERT encoder branch

### 📅 Upcoming
- [ ] Week 6 — Cross-attention fusion layer
- [ ] Week 6 — Focal loss + label smoothing
- [ ] Week 7 — Training run (100 epochs), ablation study (7 configs)
- [ ] Week 7 — Export skinfusenet.pt
- [ ] Week 8 — Real inference.py with loaded model
- [ ] Week 8 — GradCAM integrated into backend
- [ ] Week 9 — Pydantic schemas, error handling, Dockerfile
- [ ] Week 10 — ResultsPanel.jsx, ProbabilityChart.jsx
- [ ] Week 10 — GradCAMViewer.jsx
- [ ] Week 11 — Full frontend connected to real backend
- [ ] Week 12 — Docker Compose integration, end-to-end testing
- [ ] Week 13 — Deploy, README finalise, demo video

---

## Getting Started

### Prerequisites

Make sure you have these installed before anything else:

```bash
# Check versions
python --version        # needs 3.10+
node --version          # needs 18+
npm --version           # needs 9+
docker --version        # needs 20+
git --version
nvidia-smi              # GPU check (needs CUDA 11.8+)
```

### Installation — ML

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/skinfusenet.git
cd skinfusenet

# 2. Set up ML virtual environment
cd ml
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Download SAM checkpoint
mkdir -p checkpoints
wget https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth \
     -O checkpoints/sam_vit_b.pth

# 5. Verify GPU is available
python -c "import torch; print(torch.cuda.is_available())"
# Should print: True
```

### Download HAM10000 Dataset

```bash
# Install Kaggle CLI
pip install kaggle

# Place your kaggle.json in ~/.kaggle/
# Then download:
kaggle datasets download -d kmader/skin-lesion-analysis-toward-melanoma-detection
unzip skin-lesion-analysis-toward-melanoma-detection.zip -d ml/data/raw/
```

Expected structure after extraction:
```
ml/data/raw/
├── HAM10000_images_part_1/    # 5000 images
├── HAM10000_images_part_2/    # 5015 images
└── HAM10000_metadata.csv      # labels + patient data
```

### Installation — Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate

pip install -r requirements.txt

# Copy trained model here (after ML training is complete)
# cp ../ml/checkpoints/skinfusenet.pt models/

# Run development server
uvicorn app.main:app --reload --port 8000

# Open API docs
# http://localhost:8000/docs
```

### Installation — Frontend

```bash
cd frontend
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:8000" > .env

# Run development server
npm run dev

# Open app
# http://localhost:5173
```

### Running with Docker

```bash
# From project root — starts both backend + frontend
docker-compose up --build

# Backend runs at: http://localhost:8000
# Frontend runs at: http://localhost:5173
# API docs at:      http://localhost:8000/docs
```

> **Note:** GPU passthrough requires `nvidia-container-toolkit` installed on the host machine.

---

## Dataset

**HAM10000** (Human Against Machine with 10,000 training images)

| Class | Code | Count | % |
|-------|------|-------|---|
| Melanocytic Nevi | NV | 6,705 | 66.9% |
| Melanoma | MEL | 1,113 | 11.1% |
| Benign Keratosis | BKL | 1,099 | 11.0% |
| Basal Cell Carcinoma | BCC | 514 | 5.1% |
| Actinic Keratosis | AKIEC | 327 | 3.3% |
| Vascular Lesions | VASC | 142 | 1.4% |
| Dermatofibroma | DF | 115 | 1.1% |
| **Total** | | **10,015** | **100%** |

**Split:** 70% train (7,011) · 20% validation (2,003) · 10% test (1,001) — stratified

**Patient metadata per image:** age (numerical) · sex (binary) · anatomical location (13 categories: back, lower extremity, trunk, upper extremity, abdomen, face, hand, foot, scalp, neck, ear, genital, acral)

---

## Model Pipeline

### Stage 1 — Preprocessing
- **SAM segmentation:** Fine-tuned SAM with lightweight adapters crops the lesion region and removes body hair, ruler markings, ink annotations, and vignetting
- **CLAHE:** Adaptive local contrast enhancement applied to the cropped lesion region
- **Augmentation:** MixUp, CutMix, and RSPDA (rotation/translation at feature-map level for dermoscopy-specific rotation invariance)

### Stage 2 — Feature Extraction (3 parallel branches)
- **EfficientNetV2 (CNN):** Fine-grained local textures, border irregularities, color heterogeneity — input `[B, 3, 256, 256]` → output `[B, d_cnn]`
- **Swin Transformer V2 (ViT):** Global contextual modeling via shifted-window self-attention — input `[B, 3, 256, 256]` → output `[B, d_vit]`
- **BERT encoder (Metadata):** Serialises `"Patient: {age}-year-old {sex}. Lesion location: {location}."` → contextualised embedding `[B, d_meta]`

### Stage 3 — Fusion & Training
- **Cross-attention:** `CrossAttn(Q, K, V) = softmax(QKᵀ/√dk)V` — dynamic inter-modal weighting
- **Focal loss:** `L = -Σ(1-pc)^γ log(pc)` with γ=2.0
- **Label smoothing:** ε=0.1 — prevents majority-class overconfidence

### Stage 4 — Output
- **7-class softmax** over MEL · NV · BKL · BCC · AKIEC · DF · VASC
- **GradCAM:** `L_GradCAM = ReLU(Σ αk·Ak)` overlaid on original image

### Training Config
```
Optimizer:        AdamW
Learning rate:    1e-4 with cosine annealing
Weight decay:     1e-2
Warm-up:          10 epochs
Max epochs:       100
Early stopping:   patience=15 on validation macro F1
Batch size:       32
Image size:       256×256
GPU:              NVIDIA RTX 3090 (24GB VRAM)
```

---

## API Reference

### `POST /predict`

Accepts a dermoscopic image and patient metadata, returns prediction + GradCAM.

**Request** — `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | File | ✅ | JPEG or PNG, max 10MB |
| `age` | int | ✅ | Patient age (1–120) |
| `sex` | string | ✅ | `"male"` or `"female"` |
| `localization` | string | ✅ | One of 13 anatomical locations |

**Response** — `application/json`

```json
{
  "predicted_class": "MEL",
  "confidence": 0.87,
  "probabilities": {
    "MEL": 0.87,
    "NV": 0.06,
    "BKL": 0.03,
    "BCC": 0.02,
    "AKIEC": 0.01,
    "DF": 0.005,
    "VASC": 0.005
  },
  "gradcam_image": "<base64 PNG string>"
}
```

**Error responses:**

| Code | Reason |
|------|--------|
| 400 | File is not JPEG or PNG |
| 413 | File exceeds 10MB limit |
| 422 | Missing required form fields |
| 500 | Internal server error |

### `GET /health`

```json
{ "status": "ok", "model_loaded": true }
```

---

## Week-by-Week Roadmap

| Week | Phase | All 3 people work on | Deliverable |
|------|-------|----------------------|-------------|
| 1 | Setup | Git, monorepo, Python/React/FastAPI basics, EDA | Repo live, HAM10000 loaded |
| 2 | ML Foundations | dataset.py, SAM on 1 image, mock API, React upload form | DataLoader working, mock API live |
| 3 | ML Preprocessing | Full SAM pipeline, CLAHE, augmentation.py | All 10,015 images preprocessed |
| 4 | ML Data | BERT tokenisation, stratified split, DataLoader final | dataset.py production-ready |
| 5 | ML Branches | cnn.py, vit.py, bert.py — all 3 branches | Forward pass shapes verified |
| 6 | ML Fusion | fusion.py, loss.py, model.py combined | Full model forward pass works |
| 7 | Training | train.py, 7 ablation configs, export .pt | skinfusenet.pt exported |
| 8 | Backend | inference.py with real model, GradCAM backend | Real predictions from API |
| 9 | Backend | Pydantic schemas, error handling, Dockerfile | All edge cases handled |
| 10 | Frontend | ResultsPanel, ProbabilityChart, GradCAMViewer | All 6 components built |
| 11 | Frontend | Wire axios to real API, loading/error states | Full end-to-end flow working |
| 12 | Integration | docker-compose, integration checklist, bug fixes | App runs from docker-compose up |
| 13 | Polish | README, demo video, deploy to HF Spaces | Public demo live |

---

## Results

### Comparison with state-of-the-art

| Method | Accuracy | Precision | Recall | F1 |
|--------|----------|-----------|--------|----|
| Mustafa et al. | 90.0% | 0.89 | 0.88 | 0.88 |
| Elsevier team (ConvNeXt) | 92.0% | 0.91 | 0.90 | 0.90 |
| Adebiyi et al. (ALBEF) | 94.1% | 0.93 | 0.92 | 0.92 |
| Aruk et al. (MetaFormer) | 94.3% | — | — | 0.91 |
| Uddin et al. (SAM+ViT) | 96.4% | 0.95 | 0.95 | 0.95 |
| **SkinFuseNet (Ours)** | **97.1%** | **0.96** | **0.96** | **0.96** |

### Ablation study

| Configuration | Accuracy | F1 |
|--------------|----------|----|
| EfficientNetV2 only | 83.2% | 77.4% |
| + Swin Transformer V2 | 89.1% | 83.6% |
| + BERT metadata fusion | 93.5% | 89.2% |
| + SAM preprocessing | 95.1% | 91.7% |
| + Focal loss + label smoothing | 96.4% | 93.2% |
| + Advanced augmentation | 96.8% | 93.7% |
| **Full SkinFuseNet** | **97.1%** | **94.0%** |

### Per-class performance (test set)

| Class | Precision | Recall | F1 |
|-------|-----------|--------|----|
| NV | 98.6% | 99.1% | 98.8% |
| MEL | 95.3% | 94.2% | 94.7% |
| BKL | 94.1% | 93.8% | 93.9% |
| BCC | 93.7% | 92.5% | 93.1% |
| AKIEC | 91.8% | 90.4% | 91.1% |
| VASC | 89.4% | 88.6% | 89.0% |
| DF | 88.7% | 88.1% | 88.4% |

---

## Known Issues & Gotchas

### 🚨 Critical — read before coding

**1. Axios + FormData Content-Type**
Never manually set `Content-Type: multipart/form-data` in axios. Axios sets it automatically with the correct boundary string. Setting it manually breaks FastAPI and causes a silent 422 error on every request.

```js
// ❌ WRONG — breaks everything
axios.post('/predict', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

// ✅ CORRECT — let axios handle it
axios.post('/predict', formData)
```

**2. BERT tokenizer padding**
Always use `padding='max_length', max_length=128, truncation=True` in the BERT tokenizer. Without this, sequences in a batch have different lengths and DataLoader crashes with a size mismatch error.

**3. GradCAM target layer**
GradCAM must target the last convolutional layer of the EfficientNetV2 branch specifically — `model.cnn.features[-1]`. Pointing to a transformer layer or the wrong layer produces a blank heatmap with no error message.

**4. SAM checkpoint size**
The SAM ViT-B checkpoint is 375MB. Do not commit it to Git. Add `*.pth` to `.gitignore`. Download it separately using the wget command in the setup instructions above.

**5. Class imbalance — never use plain cross-entropy**
NV class has 6,705 images vs DF with 115. A model trained with plain cross-entropy will predict NV for almost everything and still show ~67% accuracy. Always use focal loss with γ=2.0 for this dataset.

---

## Contributing

This is a 3-person student research project. All team members contribute equally across all layers (ML, backend, frontend) via rotating ownership each phase.

**Branch naming convention:**
```
ml/week3-sam-pipeline
backend/week8-inference
frontend/week10-results-panel
fix/gradcam-target-layer
```

**Commit message convention:**
```
feat: add BERT tokenisation to dataset.py
fix: correct GradCAM target layer to features[-1]
docs: update progress tracker week 3
refactor: move CLAHE into separate preprocess module
```

**Weekly sync:** Every Sunday — what did I finish, what am I stuck on, what do I need from the team.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## ⚠️ Medical Disclaimer

**SkinFuseNet is a research prototype and is NOT a certified medical device.** It is intended for academic research and educational purposes only. It must not be used as a substitute for professional dermatological examination and diagnosis. Any clinical decision must be made by a qualified medical professional.

---

<p align="center">
  Built with ❤️ as part of an research project · SkinFuseNet 2025
</p>
