# PreSec-TrenSolar

Backend del MVP de **PreSec-TrenSolar**, una plataforma SaaS B2B para plantas procesadoras y acopiadoras de granos. Permite subir fotografías de muestras de legumbres, enviarlas a un microservicio de Computer Vision y registrar los porcentajes de calidad y rendimiento obtenidos.

## Stack

- Java 17
- Spring Boot 4.1.2 / Hibernate 7.4
- Spring Data JPA
- Spring MVC + `RestClient`
- PostgreSQL
- Lombok
- H2 para tests
- Maven Wrapper

## Arquitectura

```text
Frontend
   │ multipart/form-data
   ▼
Spring Boot API
   ├── FileStorageService ──────► uploads/ (almacenamiento local)
   ├── PostgreSQL (JPA)
   └── VisionIAClientService ───► FastAPI /api/predict
```

Capas principales:

| Paquete | Responsabilidad |
|---|---|
| `domain` | Entidades JPA y enums del dominio |
| `repository` | Repositorios Spring Data |
| `service` | Lógica de negocio y orquestación |
| `integration` | Cliente HTTP del microservicio de visión |
| `web` | Endpoints REST, DTOs y manejo de errores |
| `config` | Propiedades y configuración de infraestructura |

## Requisitos

- Java 17 o superior
- PostgreSQL 14 o superior
- Microservicio de visión disponible en `http://localhost:8000` para ejecutar el flujo completo

Los tests no requieren PostgreSQL ni el microservicio de visión: usan H2 y mocks.

## Configuración

El backend se ejecuta desde `backend/`.

Variables de entorno principales:

| Variable | Default | Descripción |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/presec_trensolar` | URL JDBC de PostgreSQL |
| `DB_USERNAME` | `postgres` | Usuario de base de datos |
| `DB_PASSWORD` | `postgres` | Contraseña de base de datos |
| `JPA_DDL_AUTO` | `update` | Estrategia de esquema de Hibernate |
| `FILE_STORAGE_LOCATION` | `uploads` | Carpeta local para las imágenes |
| `VISION_AI_BASE_URL` | `http://localhost:8000` | URL base del microservicio de visión |

También se pueden ajustar los timeouts del cliente AI en `backend/src/main/resources/application.properties`:

```properties
app.vision-ai.connect-timeout=2s
app.vision-ai.read-timeout=30s
```

## Ejecución

### 1. Crear la base de datos

```bash
createdb presec_trensolar
```

O con Docker:

```bash
docker run --name presec-postgres \
  -e POSTGRES_DB=presec_trensolar \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:16
```

### 2. Iniciar el backend

```bash
cd backend
./mvnw spring-boot:run
```

La API queda disponible en `http://localhost:8080`.

### 3. Ejecutar los tests

```bash
cd backend
./mvnw test
```

Para ejecutar una clase de test específica:

```bash
./mvnw test -Dtest=ImageAnalysisServiceTest
```

## API

### Analizar una muestra

```http
POST /api/sample-analyses
Content-Type: multipart/form-data
```

| Campo | Tipo | Descripción |
|---|---|---|
| `batchId` | UUID | Lote al que pertenece la muestra |
| `file` | archivo | Imagen JPEG, PNG o WEBP de hasta 10 MB |

Ejemplo:

```bash
curl -X POST http://localhost:8080/api/sample-analyses \
  -F "batchId=550e8400-e29b-41d4-a716-446655440000" \
  -F "file=@sample.jpg;type=image/jpeg"
```

Respuesta `201 Created`:

```json
{
  "id": "a1b2c3d4-...",
  "batchId": "550e8400-...",
  "originalImageUrl": "/uploads/7f3c....jpg",
  "status": "COMPLETED",
  "createdAt": "2026-11-08T16:33:00Z",
  "inferenceResult": {
    "id": "e5f6a7b8-...",
    "exportPercentage": 92.4,
    "discardPercentage": 7.6,
    "defectDetails": {
      "broken": 3,
      "discolored": 2
    },
    "heatmapImageUrl": "/uploads/heatmap.jpg"
  }
}
```

### Estados del análisis

| Estado | Descripción |
|---|---|
| `PENDING` | Estado reservado para procesamiento asíncrono |
| `PROCESSING` | La imagen fue guardada y se está consultando al servicio AI |
| `COMPLETED` | La inferencia terminó y el resultado fue persistido |
| `ERROR` | Falló la inferencia o el guardado del resultado |

El endpoint es síncrono: espera la respuesta del servicio AI antes de responder.

### Imágenes

Las imágenes se guardan con un nombre UUID en `backend/uploads/` y se sirven públicamente en:

```text
GET /uploads/<archivo>
```

En producción conviene reemplazar el almacenamiento local por S3, MinIO u otro almacenamiento de objetos.

## Flujo de análisis

1. Se valida la imagen recibida.
2. `FileStorageService` guarda la imagen y devuelve su ruta y URL pública.
3. Se crea un `SampleAnalysis` en estado `PROCESSING` y se confirma en base de datos.
4. `VisionIAClientService` envía la imagen al microservicio de visión.
5. Con la respuesta se crea un `InferenceResult`, se asocia a la muestra y se cambia el estado a `COMPLETED`.
6. Si algo falla después de crear la muestra, esta se marca como `ERROR` y se devuelve HTTP 502.

La llamada HTTP al servicio de visión se mantiene fuera de las transacciones JPA para no bloquear conexiones de base de datos durante la inferencia.

## Contrato con el servicio de visión

El backend envía un `POST` multipart a:

```text
{VISION_AI_BASE_URL}/api/predict
```

Campo enviado:

```text
file: <imagen>
```

Respuesta esperada:

```json
{
  "export_percentage": 92.4,
  "discard_percentage": 7.6,
  "defect_details": {
    "broken": 3,
    "discolored": 2
  },
  "heatmap_image_url": "/uploads/heatmap.jpg"
}
```

Los campos `export_percentage`, `discard_percentage` y `heatmap_image_url` son obligatorios. Se ignoran campos adicionales.

## Modelo de dominio

- `Customer`: empresa empaquetadora o acopiadora.
- `Batch`: partida física de granos, asociada a un cliente.
- `SampleAnalysis`: evento de captura y procesamiento de una muestra.
- `InferenceResult`: resultado generado por el servicio de visión.

Relaciones:

```text
Customer 1 ─── N Batch 1 ─── N SampleAnalysis 1 ─── 1 InferenceResult
```

Todas las entidades usan UUID, auditoría (`createdAt`, `updatedAt`) y relaciones lazy.

## Manejo de errores

| Código | Situación |
|---|---|
| `400` | Archivo inválido, vacío o formato no soportado |
| `404` | Lote o muestra no encontrado |
| `413` | Imagen mayor al límite permitido |
| `502` | Servicio de visión no disponible o respuesta inválida |
| `500` | Error interno de almacenamiento o persistencia |

## Estructura del proyecto

```text
backend/
├── src/main/java/com/app/backend/
│   ├── config/        # Propiedades y RestClient
│   ├── domain/        # Entidades y enums
│   ├── exception/     # Excepciones de dominio e infraestructura
│   ├── integration/   # Cliente del servicio de visión
│   ├── repository/    # Repositorios Spring Data
│   ├── service/       # Almacenamiento, persistencia y orquestación
│   └── web/           # Controllers, DTOs y manejo de errores
├── src/main/resources/
├── src/test/
├── pom.xml
└── mvnw
```

## Alcance actual del MVP

- No incluye autenticación ni autorización.
- No incluye endpoints para crear clientes o lotes; se asume que existen en base de datos.
- El procesamiento es síncrono.
- El almacenamiento de imágenes es local, apto para un prototipo de hackathon.
- No hay migraciones versionadas; el esquema se genera con `JPA_DDL_AUTO=update`.
- No hay CORS configurado; si el frontend corre en otro origen, debe habilitarse para `/api/**` y `/uploads/**`.
