# AGENTS.md

## Layout

- The repository has a Spring Boot app in `agtech-backend/` and a Vite/React frontend in `agtech-front/`.
- There is no vision microservice in this repo; the backend expects it at `http://localhost:8000` when running real analyses.
- Maven wrapper and `pom.xml` live in `agtech-backend/`, so run all backend build commands from `agtech-backend/` (not the repo root). Run frontend commands from `agtech-front/`.
- Main class: `agtech-backend/src/main/java/com/app/agtech/AgtechBackendApplication.java`; package root is `com.app.agtech`.
- Domain model lives in `agtech-backend/src/main/java/com/app/agtech/domain/` (`entity/` and `enums/`); repositories in `repository/`, business logic in `service/`, HTTP layer in `controller/` (package `com.app.agtech.web`), outbound integrations in `integration/`, and config in `config/`.
- Vision AI client lives in `integration/VisionIAClientService.java`; its DTO is in `integration/dto/`.
- CRUD endpoints exist for customers (`/api/customers`), batches (`/api/batches`) and inference results (`/api/inference-results`). Normal inference results are still created by the analysis flow, not the CRUD endpoint.
- Market endpoints: `GET /api/market-snapshot` (alias `/api/market/snapshot`) and `POST /api/financial/impact`. Market integration lives in `integration/MatbaRofexClient.java` and `integration/DolarApiClient.java`; orchestration is in `service/MarketDataService.java` and `service/FinancialAgentService.java`.

## Toolchain

- Java 17 (`<java.version>17</java.version>`) and Spring Boot 4.1.2 / Hibernate 7.4 — check Boot 4 APIs, not Boot 3 examples.
- Uses JPA (`spring-boot-starter-data-jpa`), Spring MVC (`spring-boot-starter-webmvc`), Bean Validation (`spring-boot-starter-validation`), `RestClient` (`spring-boot-starter-restclient`), Spring Cache + Caffeine, Lombok, and Jackson 3.
- The default datasource is **H2 in memory** at `jdbc:h2:mem:presec;MODE=PostgreSQL;DB_CLOSE_DELAY=-1` (user `sa`, empty password), so no external database is required. Override with `DB_URL`, `DB_DRIVER`, `DB_USERNAME`, `DB_PASSWORD`, and `JPA_DDL_AUTO`.
- PostgreSQL is optional: activate the `postgres` profile (`SPRING_PROFILES_ACTIVE=postgres`) to use `application-postgres.properties`.
- The HTTP server listens on port `8081` (`server.port`).
- Uploaded images go to `app.storage.location` (`uploads/` by default, resolved relative to `agtech-backend/`) and are served under `/uploads/**`; override with `FILE_STORAGE_LOCATION`. `agtech-backend/uploads/` is gitignored.
- Upload endpoint: `POST /api/sample-analyses` (multipart fields `batchId` and `file`); only JPEG/PNG/WEBP up to 10 MB. It runs the full synchronous analysis and returns the completed `InferenceResult`.
- Vision AI base URL defaults to `http://localhost:8000` and the client posts multipart field `file` to `/api/predict`; override with `VISION_AI_BASE_URL`. Timeouts are `app.vision-ai.connect-timeout` / `read-timeout`.
- `ImageAnalysisService` orchestrates the workflow (store image → persist `PROCESSING` → call Vision AI → persist `COMPLETED`); `SampleAnalysisService` owns the transactional persistence phases. Keep external HTTP calls out of JPA transactions.
- Vision AI failures mark the sample as `ERROR` and surface as HTTP 502; the stored image is retained for debugging/retry.
- Vision AI response fields must be snake_case (`export_percentage`, `discard_percentage`, `defect_details`, `heatmap_image_url`).
- Tests use in-memory H2 via `agtech-backend/src/test/resources/application.properties` and `target/test-uploads` for files; no external services are needed for `mvnw test`.
- Backend has no lint/format/checkstyle config, CI, or `opencode.json`; `mvnw test` is the only backend verification. The frontend has an `oxlint` config and `npm run lint`.

## Commands (from `agtech-backend/`)

```bash
./mvnw test                                # full test suite
./mvnw test -Dtest=AgtechBackendApplicationTests # single test class
./mvnw spring-boot:run                     # run app with H2 (default)
SPRING_PROFILES_ACTIVE=postgres ./mvnw spring-boot:run # run with PostgreSQL
./mvnw clean package                       # build jar into target/
```

## Commands (from `agtech-front/`)

```bash
npm install
npm run dev     # Vite dev server on http://localhost:5173
npm run build   # TypeScript build + production bundle
npm run lint    # oxlint
npm run preview # serve the production build
```

## Gotchas

- `agtech-backend/HELP.md` is listed in `agtech-backend/.gitignore`; edits to it are ignored by git.
- `agtech-backend/target/` is generated output; never edit it.
