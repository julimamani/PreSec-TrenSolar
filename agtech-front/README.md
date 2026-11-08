# PuroGrano · Grain Intelligence

Frontend del MVP AgTech de PuroGrano. Analiza una foto de grano, estima calidad y
defectos con un modelo simulado, y cruza el resultado con pizarras de mercado para
calcular una valuación por tonelada.

La aplicación corre hoy 100 % en modo demo. Está preparada para conectar un servicio
de inferencia FastAPI y el backend Spring Boot sin cambiar componentes.

## Stack

- Vite + React 19 + TypeScript estricto
- React Router para las rutas del producto
- Recharts para series, radar, barras y gauges
- Lucide para iconografía
- CSS propio dividido por dominio en `src/styles/`

## Puesta en marcha

```bash
cd agtech-front
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

```bash
npm run build   # build de producción
npm run lint    # oxlint
npm run preview # serve del build
```

## Rutas

| Ruta         | Pantalla                                                     |
| ------------ | ------------------------------------------------------------ |
| `/`          | Landing pública, carga de imagen y resultado resumido        |
| `/dashboard` | Panel de mercado, calidad, pizarras y última muestra         |
| `/analizar`  | Laboratorio de análisis completo                             |
| `/mercado`   | Series comparadas, liquidez, basis y tabla de cotizaciones   |
| `/informes`  | Historial, distribución de grados y exportación CSV          |
| `/panel`     | Redirección a `/dashboard`                                   |

## Flujo de análisis

1. El usuario elige una imagen JPG/PNG/WEBP de hasta 10 MB y el tipo de grano.
2. `analyzeSample()` devuelve un resultado tipado (`AnalysisResult`).
3. El resultado se guarda en `localStorage` y se emite un evento interno.
4. El dashboard y los informes leen la última muestra y el historial mediante
   `useStoredAnalysis`.
5. Cada análisis genera un ID `PG-XXXX`, un grado A/B/C/D, defectos, atributos
   fisicoquímicos y una valuación contra la pizarra vigente.

Las claves nuevas son `purograno:last-analysis:v1` y
`purograno:analysis-history:v1`. Al iniciar, la app migra automáticamente datos
guardados con las claves anteriores de TrenSolar.

## Modo demo vs. APIs reales

Por defecto `VITE_USE_MOCK=true`, por lo que la inferencia y el guardado se simulan
localmente. Copiá `.env.example` a `.env` y ajustá las variables para conectar los
servicios reales.

```env
VITE_USE_MOCK=false
VITE_ANALYSIS_API_URL=http://localhost:8000
VITE_BACKEND_API_URL=http://localhost:8080
VITE_PREDICT_PATH=/predict
VITE_SAVE_ANALYSIS_PATH=/api/v1/analyses
VITE_SPLINE_SCENE_URL=
```

### Contrato de inferencia

`POST {VITE_ANALYSIS_API_URL}{VITE_PREDICT_PATH}` con `multipart/form-data`:

- `file`: imagen
- `grain`: `soja | maiz | trigo | poroto`
- `variety`: texto opcional

La respuesta debe ser un `AnalysisResult` completo, con la misma forma que
`src/types/analysis.ts`.

### Contrato de persistencia

`POST {VITE_BACKEND_API_URL}{VITE_SAVE_ANALYSIS_PATH}` con el `AnalysisResult` en JSON.
Se espera `{ "id": "..." }`; si no viene `id`, se conserva el de la inferencia.

## Escena 3D / Spline

La sección de flujo del grano muestra una escena isométrica interactiva propia en SVG.
Si se define `VITE_SPLINE_SCENE_URL`, se renderiza esa escena de Spline en un iframe y
la SVG queda como fallback. El valor debe ser la URL pública del proyecto de Spline
(por ejemplo, `https://prod.spline.design/.../scene.splinecode`).

## Estructura

```text
src/
  api/          Integración con inferencia, backend y mercado
  components/   UI, charts, layout, landing y análisis
  data/         Snapshot de mercado y perfiles demo
  hooks/        Análisis, mercado y lectura de localStorage
  lib/          Formato, clases y persistencia
  pages/        Landing, dashboard, análisis, mercado e informes
  styles/       Sistema visual dividido por dominio
  types/        Tipos de dominio estrictos
```

## Alcance

Los datos de mercado son simulados y no constituyen asesoramiento financiero. El
backend Spring Boot del repositorio no se modifica desde este frontend.
