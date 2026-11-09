# AgTech Vision · Backend

Backend del MVP de **AgTech Vision / PreSec-TrenSolar**, una plataforma SaaS B2B para plantas procesadoras y acopiadoras de granos. Permite subir fotografías de muestras de legumbres, enviarlas a un microservicio de Computer Vision y registrar los porcentajes de calidad y rendimiento obtenidos. También expone un agente de mercado híbrido y un estimador de impacto financiero.

## Stack

- Java 17
- Spring Boot 4.1.2 / Hibernate 7.4
- Spring Data JPA
- Spring MVC + `RestClient`
- **H2 en memoria (base de datos por defecto)**
- PostgreSQL (opcional, perfil `postgres`)
- Spring Cache + Caffeine para el snapshot de mercado
- Lombok
- Maven Wrapper

## Arquitectura

```text
Frontend
   │ multipart/form-data / JSON
   ▼
Spring Boot API
   ├── FileStorageService ──────► uploads/ (almacenamiento local)
   ├── H2 en memoria (JPA, por defecto)
   │   └── PostgreSQL opcional (perfil "postgres")
   ├── VisionIAClientService ───► FastAPI /api/predict
   ├── MatbaRofexClient ────────► API de Matba Rofex
   ├── DolarApiClient ──────────► DolarAPI
   └── MarketDataService ───────► snapshot con caché (Caffeine)
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
- **H2 incluido**: no hace falta instalar ni crear ninguna base de datos para desarrollo
- PostgreSQL 14 o superior solo si activás el perfil `postgres`
- Microservicio de visión disponible en `http://localhost:8000` para ejecutar el flujo completo de análisis

Los tests no requieren PostgreSQL ni el microservicio de visión: usan H2 en memoria y mocks.

## Configuración

El backend se ejecuta desde `agtech-backend/`.

Variables de entorno principales:

| Variable | Default | Descripción |
|---|---|---|
| `SERVER_PORT` / `server.port` | `8081` | Puerto HTTP del backend |
| `DB_URL` | `jdbc:h2:mem:presec;MODE=PostgreSQL;DB_CLOSE_DELAY=-1` | URL JDBC de H2 en memoria |
| `DB_DRIVER` | `org.h2.Driver` | Driver JDBC de la base por defecto |
| `DB_USERNAME` | `sa` | Usuario de H2 |
| `DB_PASSWORD` | vacío | Contraseña de H2 |
| `JPA_DDL_AUTO` | `update` | Estrategia de esquema de Hibernate |
| `FILE_STORAGE_LOCATION` | `uploads` | Carpeta local para las imágenes |
| `VISION_AI_BASE_URL` | `http://localhost:8000` | URL base del microservicio de visión |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:*,http://127.0.0.1:*` | Orígenes permitidos para el frontend |

Para el agente de mercado también se pueden configurar `REMARKETS_USER`,
`REMARKETS_PASSWORD`, `REMARKETS_ACCOUNT`, `DOLAR_API_URL`,
`MARKET_CACHE_TTL`, `POROTO_SPOT_USD` y los precios de fallback. Ver
`agtech-backend/.env.example` y `application.properties`.

También se pueden ajustar los timeouts del cliente AI en `agtech-backend/src/main/resources/application.properties`:

```properties
app.vision-ai.connect-timeout=2s
app.vision-ai.read-timeout=30s
```

## Ejecución

### 1. Iniciar el backend con H2 (recomendado)

No hace falta crear ni instalar una base de datos. H2 se levanta en memoria al
arrancar la aplicación.

```bash
cd agtech-backend
./mvnw spring-boot:run
```

La API queda disponible en `http://localhost:8081`.

### 2. Ejecutar los tests

```bash
cd agtech-backend
./mvnw test
```

Para ejecutar una clase de test específica:

```bash
./mvnw test -Dtest=ImageAnalysisServiceTest
```

Los tests usan H2 en memoria y no necesitan PostgreSQL ni el microservicio de visión.

### 3. Usar PostgreSQL (opcional)

Si preferís PostgreSQL, activá el perfil `postgres`:

```bash
cd agtech-backend
SPRING_PROFILES_ACTIVE=postgres ./mvnw spring-boot:run
```

O con variables de entorno:

```bash
DB_URL=jdbc:postgresql://localhost:5432/presec_trensolar \
DB_USERNAME=postgres \
DB_PASSWORD=postgres \
SPRING_PROFILES_ACTIVE=postgres \
./mvnw spring-boot:run
```

La base debe existir previamente:

```bash
createdb presec_trensolar
```

O levantar PostgreSQL con Docker:

```bash
docker run --name presec-postgres \
  -e POSTGRES_DB=presec_trensolar \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:16
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
curl -X POST http://localhost:8081/api/sample-analyses \
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

### Clientes

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/customers` | Lista todos los clientes |
| `GET` | `/api/customers/{id}` | Obtiene un cliente |
| `POST` | `/api/customers` | Crea un cliente |
| `PUT` | `/api/customers/{id}` | Actualiza un cliente |
| `DELETE` | `/api/customers/{id}` | Elimina un cliente y sus lotes en cascada |

Ejemplo de creación:

```bash
curl -X POST http://localhost:8081/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Acopio Central",
    "taxId": "30-12345678-9",
    "subscriptionPlan": "PRO"
  }'
```

### Lotes

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/batches` | Lista todos los lotes |
| `GET` | `/api/batches?customerId={uuid}` | Filtra lotes por cliente |
| `GET` | `/api/batches/{id}` | Obtiene un lote |
| `POST` | `/api/batches` | Crea un lote |
| `PUT` | `/api/batches/{id}` | Actualiza un lote |
| `DELETE` | `/api/batches/{id}` | Elimina un lote y sus muestras en cascada |

Ejemplo de creación:

```bash
curl -X POST http://localhost:8081/api/batches \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "variety": "Alubia Cargamanto",
    "estimatedTons": 12.5
  }'
```

### Resultados de inferencia

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/inference-results` | Lista todos los resultados |
| `GET` | `/api/inference-results/{id}` | Obtiene un resultado |
| `GET` | `/api/inference-results/by-sample-analysis/{sampleAnalysisId}` | Busca por muestra |
| `POST` | `/api/inference-results` | Crea un resultado manualmente |
| `PUT` | `/api/inference-results/{id}` | Actualiza un resultado |
| `DELETE` | `/api/inference-results/{id}` | Elimina un resultado |

El flujo normal genera el resultado automáticamente al analizar una muestra. Estos endpoints CRUD están pensados para tareas administrativas o de desarrollo.

### Mercado

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/market-snapshot` | Snapshot de mercado (también disponible en `/api/market/snapshot`) |

El snapshot combina precios de Matba Rofex, el tipo de cambio de DolarAPI y un
spot regional configurable para el poroto. Se cachea con Caffeine durante 15
minutos por defecto (`MARKET_CACHE_TTL`). Si las credenciales de reMarkets no
están configuradas, se usan precios de fallback.

### Impacto financiero

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/financial/impact` | Estima la pérdida en USD/ARS a partir del porcentaje de defectos |

Ejemplo:

```bash
curl -X POST http://localhost:8081/api/financial/impact \
  -H "Content-Type: application/json" \
  -d '{
    "grain": "poroto",
    "tons": 10,
    "defectPercentage": 7.5,
    "venue": "global"
  }'
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

Las imágenes se guardan con un nombre UUID en `agtech-backend/uploads/` y se sirven públicamente en:

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
| `502` | Servicio de visión o proveedor de mercado no disponible, o respuesta inválida |
| `500` | Error interno de almacenamiento o persistencia |

## Estructura del proyecto

```text
agtech-backend/
├── src/main/java/com/app/agtech/
│   ├── config/        # Propiedades, RestClient, caché y CORS
│   ├── domain/        # Entidades y enums
│   ├── exception/     # Excepciones de dominio e infraestructura
│   ├── integration/   # Clientes de visión, Matba Rofex y DolarAPI
│   ├── repository/    # Repositorios Spring Data
│   ├── service/       # Almacenamiento, persistencia, mercado y finanzas
│   └── controller/    # Controllers, DTOs y manejo de errores (paquete web)
├── src/main/resources/
│   ├── application.properties            # H2 por defecto
│   └── application-postgres.properties   # Perfil opcional de PostgreSQL
├── src/test/
├── pom.xml
└── mvnw
```

## Alcance actual del MVP

- No incluye autenticación ni autorización.
- Los listados CRUD no tienen paginación; devuelven todos los registros.
- El procesamiento es síncrono.
- El almacenamiento de imágenes es local, apto para un prototipo de hackathon.
- No hay migraciones versionadas; el esquema se genera con `JPA_DDL_AUTO=update`.
- CORS está habilitado para `/api/**` y `/uploads/**`; los orígenes se configuran con `CORS_ALLOWED_ORIGINS`.
- H2 en memoria es el default: los datos se pierden al reiniciar. Para persistencia real, usar el perfil `postgres`.
