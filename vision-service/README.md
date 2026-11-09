# Vision Service

Microservicio Python/FastAPI que consume `VisionIAClientService` desde el backend
Spring Boot.

## Contrato

```http
POST /api/predict
Content-Type: multipart/form-data

file: <imagen>
```

Respuesta:

```json
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
  "heatmap_image_url": "http://localhost:8000/static/heatmaps/<uuid>.png",
  "processing_ms": 42.1,
  "model_version": "opencv-demo-v1"
}
```

El backend solo exige `export_percentage`, `discard_percentage` y
`heatmap_image_url` no vacío. Los campos extra se ignoran.

## Ejecución

```bash
cd vision-service
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Probar:

```bash
curl -X POST http://localhost:8000/api/predict \
  -F "file=@sample.jpg"
```

Documentación interactiva: `http://localhost:8000/docs`.

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `PUBLIC_BASE_URL` | `http://localhost:8000` | URL usada para el heatmap |
| `MAX_UPLOAD_BYTES` | `10485760` | Tamaño máximo del archivo |
| `MAX_IMAGE_SIDE` | `1600` | Lado máximo de procesamiento |
| `MOCK_MODE` | `false` | Devuelve un resultado determinístico de demo |

Para una demo sin depender de la segmentación:

```bash
MOCK_MODE=true uvicorn main:app --reload --port 8000
```

## Cómo funciona el demo

1. Segmenta los granos con OpenCV (color de fondo, Otsu, morfología y contornos).
2. Mide área, perímetro, circularidad, solidez y relación de aspecto.
3. Compara color/saturación contra la mediana de los granos.
4. Aplica reglas simples para clasificar:
   - `broken`
   - `discolored`
   - `wrinkled`
   - `foreign_matter`
5. Calcula `export_percentage` y `discard_percentage` por cantidad de granos.
6. Genera un heatmap con las zonas defectuosas y lo sirve en `/static/heatmaps/`.

## Limitaciones

- Es un demo con reglas, no un modelo entrenado.
- Es sensible a iluminación, fondo y granos superpuestos.
- Los porcentajes son una estimación visual; no miden humedad ni proteína.
- Para producción, reemplazar `analyze_image()` por un modelo de clasificación
  o segmentación entrenado con imágenes reales.
