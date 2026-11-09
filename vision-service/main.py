"""
Servicio de visión para PreSec-TrenSolar / AgTech Vision.

Expone el contrato que consume `VisionIAClientService`:

    POST /api/predict
    multipart/form-data: file=<imagen>

Respuesta:

    {
      "export_percentage": 92.4,
      "discard_percentage": 7.6,
      "defect_details": {
        "total_grains": 100,
        "healthy_grains": 92,
        "defective_grains": 8,
        "broken": 3,
        "discolored": 5,
        "wrinkled": 0,
        "foreign_matter": 0,
        "defective_area_pct": 7.1
      },
      "heatmap_image_url": "http://localhost:8000/static/heatmaps/<uuid>.png"
    }

Este archivo implementa un pipeline de demo con OpenCV. No es un modelo
entrenado: segmenta granos, mide forma/color y aplica reglas simples para
estimar defectos. Las reglas están pensadas para ser reemplazadas por un modelo
real (clasificación, detección o segmentación) más adelante.

Ejecutar:

    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

Variables de entorno:

    PUBLIC_BASE_URL   URL pública usada para armar heatmap_image_url.
                      Default: http://localhost:8000
    MAX_UPLOAD_BYTES  Tamaño máximo del archivo. Default: 10 MB.
    MAX_IMAGE_SIDE    Lado máximo para procesar. Default: 1600 px.
    MOCK_MODE         true/1 para devolver un resultado determinístico de demo
                      sin depender de la segmentación. Default: false.
"""

from __future__ import annotations

import hashlib
import logging
import os
import time
import uuid
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# ---------------------------------------------------------------------------
# Configuración
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
HEATMAP_DIR = STATIC_DIR / "heatmaps"
HEATMAP_DIR.mkdir(parents=True, exist_ok=True)

PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))
MAX_IMAGE_SIDE = int(os.getenv("MAX_IMAGE_SIDE", "1600"))
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() in {"1", "true", "yes", "on"}

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/pjpeg",
    "image/png",
    "image/webp",
    "application/octet-stream",
}

logger = logging.getLogger("vision-service")

# Colores BGR para dibujar sobre el heatmap
HEALTHY_COLOR = (0, 200, 0)
DEFECT_COLORS = {
    "broken": (0, 0, 255),
    "discolored": (0, 140, 255),
    "wrinkled": (255, 0, 255),
    "foreign_matter": (0, 255, 255),
}

# Umbrales del demo. Ajustar con fotos reales.
MIN_CONTOUR_AREA_RATIO = 0.00002
MAX_CONTOUR_AREA_RATIO = 0.35
BROKEN_AREA_RATIO = 0.60
BROKEN_SOLIDITY = 0.82
BROKEN_ASPECT_RATIO = 2.00
WRINKLED_CIRCULARITY = 0.55
DISCOLORED_LAB_DISTANCE = 16.0
DISCOLORED_SATURATION_DELTA = 30.0
FOREIGN_AREA_RATIO = 2.00
FOREIGN_LAB_DISTANCE = 28.0

# ---------------------------------------------------------------------------
# FastAPI
# ---------------------------------------------------------------------------

app = FastAPI(
    title="PreSec-TrenSolar Vision Service",
    description="Demo de análisis visual de granos con OpenCV.",
    version="0.1.0",
)

# Útil si el frontend llama directo a este servicio en modo demo.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "mock_mode": MOCK_MODE,
        "max_upload_bytes": MAX_UPLOAD_BYTES,
    }


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "PreSec-TrenSolar Vision Service",
        "predict": "POST /api/predict",
        "health": "GET /health",
        "docs": "/docs",
    }


@app.post("/api/predict")
async def predict(file: UploadFile = File(...)) -> dict[str, Any]:
    started_at = time.perf_counter()

    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported image type")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image too large")

    image = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image")

    image = resize_for_processing(image, MAX_IMAGE_SIDE)

    try:
        if MOCK_MODE:
            result = build_mock_result(image, raw)
        else:
            result = analyze_image(image)
    except ValueError as exception:
        raise HTTPException(status_code=422, detail=str(exception)) from exception
    except Exception as exception:
        logger.exception("Image analysis failed for %s", file.filename)
        raise HTTPException(
            status_code=500,
            detail="Image analysis failed",
        ) from exception

    heatmap = result.pop("heatmap")
    heatmap_name = f"{uuid.uuid4().hex}.png"
    heatmap_path = HEATMAP_DIR / heatmap_name
    if not cv2.imwrite(str(heatmap_path), heatmap):
        raise HTTPException(status_code=500, detail="Could not save heatmap")

    result["heatmap_image_url"] = f"{PUBLIC_BASE_URL}/static/heatmaps/{heatmap_name}"
    result["processing_ms"] = round((time.perf_counter() - started_at) * 1000, 2)
    result["model_version"] = "opencv-demo-v1"
    return result


# ---------------------------------------------------------------------------
# Pipeline de análisis
# ---------------------------------------------------------------------------


@dataclass
class Grain:
    contour: np.ndarray
    area: float
    perimeter: float
    circularity: float
    solidity: float
    aspect_ratio: float
    mean_lab: np.ndarray
    mean_saturation: float
    defect: str | None = None
    metadata: dict[str, float] = field(default_factory=dict)


def resize_for_processing(image: np.ndarray, max_side: int) -> np.ndarray:
    height, width = image.shape[:2]
    longest = max(height, width)
    if longest <= max_side:
        return image

    scale = max_side / float(longest)
    new_size = (max(1, int(width * scale)), max(1, int(height * scale)))
    return cv2.resize(image, new_size, interpolation=cv2.INTER_AREA)


def analyze_image(image: np.ndarray) -> dict[str, Any]:
    contours = segment_grains(image)
    grains = [measure_grain(contour, image) for contour in contours]
    if not grains:
        raise ValueError("No grains were detected in the image")

    classify_grains(grains)

    total = len(grains)
    defective = [grain for grain in grains if grain.defect]
    defect_counts = Counter(grain.defect for grain in defective if grain.defect)

    total_area = sum(grain.area for grain in grains)
    defective_area = sum(grain.area for grain in defective)
    discard_pct = (len(defective) / total) * 100.0
    export_pct = 100.0 - discard_pct
    defective_area_pct = (defective_area / total_area) * 100.0 if total_area else 0.0

    return {
        "export_percentage": round(export_pct, 2),
        "discard_percentage": round(discard_pct, 2),
        "defect_details": {
            "total_grains": total,
            "healthy_grains": total - len(defective),
            "defective_grains": len(defective),
            "broken": defect_counts.get("broken", 0),
            "discolored": defect_counts.get("discolored", 0),
            "wrinkled": defect_counts.get("wrinkled", 0),
            "foreign_matter": defect_counts.get("foreign_matter", 0),
            "defective_area_pct": round(defective_area_pct, 2),
        },
        "heatmap": build_heatmap(image, grains),
    }


def segment_grains(image: np.ndarray) -> list[np.ndarray]:
    """
    Prueba varias máscaras y elige la que encuentra más contornos plausibles.
    Funciona razonablemente con fondos claros u oscuros.
    """
    best_contours: list[np.ndarray] = []
    best_score = -1.0

    for mask in candidate_masks(image):
        cleaned = clean_mask(mask)
        contours = plausible_contours(cleaned, image.shape)
        if not contours:
            continue

        # Preferimos entre 1 y 300 granos; si hay demasiado ruido, penalizamos.
        count = len(contours)
        score = float(count) if count <= 300 else 300.0 - (count - 300) * 0.1
        if score > best_score:
            best_contours = contours
            best_score = score

    if not best_contours:
        raise ValueError(
            "No grains were detected. Use a uniform background and better lighting."
        )
    return best_contours


def candidate_masks(image: np.ndarray):
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    height, width = image.shape[:2]
    border = max(4, min(height, width) // 50)

    border_pixels = np.concatenate(
        [
            lab[:border, :, :].reshape(-1, 3),
            lab[-border:, :, :].reshape(-1, 3),
            lab[:, :border, :].reshape(-1, 3),
            lab[:, -border:, :].reshape(-1, 3),
        ]
    )
    background = np.median(border_pixels, axis=0)

    distance = np.linalg.norm(lab.astype(np.float32) - background, axis=2)
    distance_norm = cv2.normalize(distance, None, 0, 255, cv2.NORM_MINMAX)
    distance_norm = distance_norm.astype(np.uint8)
    _, color_mask = cv2.threshold(
        distance_norm, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )
    yield color_mask

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, otsu = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    yield otsu
    yield cv2.bitwise_not(otsu)


def clean_mask(mask: np.ndarray) -> np.ndarray:
    height, width = mask.shape[:2]
    kernel_size = max(3, int(min(height, width) * 0.004))
    if kernel_size % 2 == 0:
        kernel_size += 1
    kernel = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE, (kernel_size, kernel_size)
    )
    cleaned = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel, iterations=1)
    return cleaned


def plausible_contours(mask: np.ndarray, image_shape: tuple[int, ...]) -> list[np.ndarray]:
    height, width = image_shape[:2]
    image_area = float(height * width)
    min_area = max(30.0, image_area * MIN_CONTOUR_AREA_RATIO)
    max_area = image_area * MAX_CONTOUR_AREA_RATIO

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    result: list[np.ndarray] = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if min_area <= area <= max_area:
            result.append(contour)
    return result


def measure_grain(contour: np.ndarray, image: np.ndarray) -> Grain:
    area = float(cv2.contourArea(contour))
    perimeter = float(cv2.arcLength(contour, True))
    circularity = 0.0
    if perimeter > 0:
        circularity = min(1.0, (4.0 * np.pi * area) / (perimeter * perimeter))

    hull = cv2.convexHull(contour)
    hull_area = float(cv2.contourArea(hull))
    solidity = area / hull_area if hull_area > 0 else 0.0

    rect = cv2.minAreaRect(contour)
    rect_width, rect_height = rect[1]
    short_side = max(1.0, min(rect_width, rect_height))
    long_side = max(rect_width, rect_height)
    aspect_ratio = long_side / short_side

    mask = np.zeros(image.shape[:2], dtype=np.uint8)
    cv2.drawContours(mask, [contour], -1, 255, cv2.FILLED)

    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    mean_lab = np.array(cv2.mean(lab, mask=mask)[:3], dtype=np.float32)
    mean_saturation = float(cv2.mean(hsv, mask=mask)[1])

    return Grain(
        contour=contour,
        area=area,
        perimeter=perimeter,
        circularity=circularity,
        solidity=solidity,
        aspect_ratio=aspect_ratio,
        mean_lab=mean_lab,
        mean_saturation=mean_saturation,
    )


def classify_grains(grains: list[Grain]) -> None:
    median_area = float(np.median([grain.area for grain in grains]))
    median_lab = np.median(
        np.stack([grain.mean_lab for grain in grains]), axis=0
    )
    median_saturation = float(
        np.median([grain.mean_saturation for grain in grains])
    )

    for grain in grains:
        color_distance = float(np.linalg.norm(grain.mean_lab - median_lab))
        saturation_delta = grain.mean_saturation - median_saturation

        if (
            grain.area > median_area * FOREIGN_AREA_RATIO
            and color_distance > FOREIGN_LAB_DISTANCE
        ):
            grain.defect = "foreign_matter"
        elif (
            grain.area < median_area * BROKEN_AREA_RATIO
            or grain.solidity < BROKEN_SOLIDITY
            or grain.aspect_ratio > BROKEN_ASPECT_RATIO
        ):
            grain.defect = "broken"
        elif (
            color_distance > DISCOLORED_LAB_DISTANCE
            or saturation_delta > DISCOLORED_SATURATION_DELTA
        ):
            grain.defect = "discolored"
        elif grain.circularity < WRINKLED_CIRCULARITY:
            grain.defect = "wrinkled"
        else:
            grain.defect = None

        grain.metadata = {
            "color_distance": round(color_distance, 2),
            "saturation_delta": round(saturation_delta, 2),
        }


def build_heatmap(image: np.ndarray, grains: list[Grain]) -> np.ndarray:
    heatmap = image.copy()
    defect_mask = np.zeros(image.shape[:2], dtype=np.uint8)

    for grain in grains:
        if grain.defect:
            cv2.drawContours(defect_mask, [grain.contour], -1, 255, cv2.FILLED)

    if defect_mask.any():
        blurred = cv2.GaussianBlur(defect_mask, (0, 0), sigmaX=5)
        colored = cv2.applyColorMap(blurred, cv2.COLORMAP_JET)
        overlay = cv2.addWeighted(image, 0.55, colored, 0.45, 0)
        heatmap = np.where(blurred[..., None] > 0, overlay, heatmap).astype(np.uint8)

    for grain in grains:
        color = DEFECT_COLORS.get(grain.defect or "", HEALTHY_COLOR)
        cv2.drawContours(heatmap, [grain.contour], -1, color, 2)

    legend = "Verde: sano | Rojo/Naranja: defecto"
    cv2.putText(
        heatmap,
        legend,
        (16, 32),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )
    return heatmap


# ---------------------------------------------------------------------------
# Modo demo determinístico
# ---------------------------------------------------------------------------


def build_mock_result(image: np.ndarray, raw: bytes) -> dict[str, Any]:
    """
    Resultado estable a partir del hash de la imagen. Sirve como fallback para
    una demo cuando el pipeline real no está disponible.
    """
    digest = hashlib.sha256(raw).digest()
    discard_pct = 3.0 + (digest[0] % 1000) / 100.0
    export_pct = 100.0 - discard_pct

    defect_details = {
        "total_grains": 80 + digest[1] % 40,
        "healthy_grains": 0,
        "defective_grains": 0,
        "broken": digest[2] % 4,
        "discolored": digest[3] % 5,
        "wrinkled": digest[4] % 3,
        "foreign_matter": digest[5] % 2,
        "defective_area_pct": round(discard_pct, 2),
        "mock": True,
    }
    defect_details["defective_grains"] = (
        defect_details["broken"]
        + defect_details["discolored"]
        + defect_details["wrinkled"]
        + defect_details["foreign_matter"]
    )
    defect_details["healthy_grains"] = (
        defect_details["total_grains"] - defect_details["defective_grains"]
    )

    heatmap = image.copy()
    height, width = image.shape[:2]
    center = (
        int(width * (0.25 + (digest[6] % 50) / 100.0)),
        int(height * (0.25 + (digest[7] % 50) / 100.0)),
    )
    radius = max(20, min(height, width) // 8)
    mask = np.zeros(image.shape[:2], dtype=np.uint8)
    cv2.circle(mask, center, radius, 255, cv2.FILLED)
    colored = cv2.applyColorMap(mask, cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(image, 0.55, colored, 0.45, 0)
    heatmap = np.where(mask[..., None] > 0, overlay, heatmap).astype(np.uint8)
    cv2.putText(
        heatmap,
        "MOCK MODE",
        (16, 32),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )

    return {
        "export_percentage": round(export_pct, 2),
        "discard_percentage": round(discard_pct, 2),
        "defect_details": defect_details,
        "heatmap": heatmap,
    }
