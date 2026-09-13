# SkinFuseNet — Stratified Split Verification Report

> **Author:** Person C  
> **Status:** ✅ ALL CHECKS PASSED

### 1. Dataset Partition Summary

- **Full Dataset:** 10015 images (100%)
- **Train Set:** 7010 images (70.00% target: ~70%)
- **Validation Set:** 2003 images (20.00% target: ~20%)
- **Test Set:** 1002 images (10.00% target: ~10%)

### 2. Class Distribution Across Splits (±2.0% Tolerance)

| Class | Full Dataset | Train Set | Val Set | Test Set | Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NV` | 66.95% | 66.95% | 66.95% | 66.97% | ✅ PASS |
| `MEL` | 11.11% | 11.11% | 11.13% | 11.08% | ✅ PASS |
| `BKL` | 10.97% | 10.97% | 10.98% | 10.98% | ✅ PASS |
| `BCC` | 5.13% | 5.14% | 5.14% | 5.09% | ✅ PASS |
| `AKIEC` | 3.27% | 3.27% | 3.25% | 3.29% | ✅ PASS |
| `VASC` | 1.42% | 1.43% | 1.40% | 1.40% | ✅ PASS |
| `DF` | 1.15% | 1.14% | 1.15% | 1.20% | ✅ PASS |

### 3. Minority Class Evaluation Readiness

- **`VASC`**: 14 samples (✅ PASS)
- **`DF`**: 12 samples (✅ PASS)

### 4. Reproducibility

- **Deterministic Seed (42):** ✅ Confirmed identical across repeated runs.
