# PuroGrano · Grain Intelligence

Frontend del MVP AgTech de PuroGrano. Analiza una foto de grano, estima calidad y
defectos, y cruza el resultado con pizarras de mercado para calcular una valuación
por tonelada.

La aplicación corre en modo demo por defecto y, al desactivar `VITE_USE_MOCK`,
consume directamente el backend Spring Boot (`/api/sample-analyses`,
`/api/batches`, `/api/inference-results` y `/api/market-snapshot`).

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
2. `analyzeSample()` resuelve un lote con `GET /api/batches` (o crea cliente y lote
   demo si todavía no existe) y sube la imagen con `POST /api/sample-analyses`.
3. El backend ejecuta el flujo completo, persiste la muestra y devuelve el
   `InferenceResult`.
4. El frontend adapta esa respuesta a `AnalysisResult` y la guarda en
   `localStorage`, además de emitir un evento interno.
5. El dashboard y los informes leen la última muestra y el historial mediante
   `useStoredAnalysis` y `GET /api/inference-results`.
6. Cada análisis genera un grado A/B/C/D, defectos, y una valuación contra la
   pizarra vigente del snapshot de mercado.

Las claves nuevas son `purograno:last-analysis:v1` y
`purograno:analysis-history:v1`. Al iniciar, la app migra automáticamente datos
guardados con las claves anteriores de TrenSolar.

## Modo demo vs. APIs reales

Por defecto `VITE_USE_MOCK=true`, por lo que la inferencia se simula localmente y
no se escribe en el backend. Copiá `.env.example` a `.env` y desactivá el mock
para usar los servicios reales.

```env
VITE_USE_MOCK=false
VITE_BACKEND_API_URL=http://localhost:8081
VITE_SAMPLE_ANALYSIS_PATH=/api/sample-analyses
VITE_MARKET_API_URL=http://localhost:8081/api/market-snapshot
VITE_SPLINE_SCENE_URL=
```

El backend Spring Boot del repositorio escucha en `http://localhost:8081` y usa
MySQL por defecto (perfil `h2` para memoria).

### Endpoints consumidos

| Método | Endpoint                        | Uso                                         |
| ------ | ------------------------------- | ------------------------------------------- |
| GET    | `/api/market-snapshot`          | Cotizaciones, series y pizarras             |
| GET    | `/api/batches`                  | Listado de lotes para el selector           |
| POST   | `/api/batches`                  | Alta automática de un lote demo             |
| GET    | `/api/customers`                | Reutilizar el cliente existente             |
| POST   | `/api/customers`                | Alta automática de un cliente demo          |
| POST   | `/api/sample-analyses`          | Subida de imagen + inferencia + persistencia |
| GET    | `/api/inference-results`        | Historial persistido para informes          |
| POST   | `/api/financial/impact`         | Pérdida estimada por descarte del lote      |

`POST /api/sample-analyses` espera `multipart/form-data` con `batchId` y `file`.
El backend se encarga de llamar al microservicio de visión (`VISION_AI_BASE_URL`)
y de guardar el `InferenceResult`; el frontend no llama a FastAPI directamente.

### Datos que el backend no persiste

El modelo de datos del backend guarda exportable, descarte, defectos y heatmap,
pero no el grano, la variedad ni los atributos fisicoquímicos. Por eso los
análisis que vienen de `GET /api/inference-results` muestran “Sin clasificar” en
el grano y sin confianza ni precio; los análisis recién subidos desde la UI sí
conservan el grano elegido y la valuación calculada con el snapshot de mercado.

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
