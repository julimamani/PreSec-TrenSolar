# AGENTS.md

## Layout

- Only the Spring Boot app in `agtech-backend/` exists; there is no frontend or other module yet.
- Maven wrapper and `pom.xml` live in `agtech-backend/`, so run all build commands from `agtech-backend/` (not the repo root).
- Main class: `agtech-backend/src/main/java/com/app/agtech/AgtechBackendApplication.java`; package root is `com.app.agtech`.
- Domain model lives in `agtech-backend/src/main/java/com/app/agtech/domain/` (`entity/` and `enums/`); repositories in `repository/`, business logic in `service/`, HTTP layer in `web/`, outbound integrations in `integration/`, and config in `config/`.
- Vision AI client lives in `integration/VisionIAClientService.java`; its DTO is in `integration/dto/`.
- CRUD endpoints exist for customers (`/api/customers`), batches (`/api/batches`) and inference results (`/api/inference-results`). Normal inference results are still created by the analysis flow, not the CRUD endpoint.

## Toolchain

- Java 17 (`<java.version>17</java.version>`) and Spring Boot 4.1.2 / Hibernate 7.4 — check Boot 4 APIs, not Boot 3 examples.
- Uses JPA (`spring-boot-starter-data-jpa`), Spring MVC (`spring-boot-starter-webmvc`), Bean Validation (`spring-boot-starter-validation`), `RestClient` (`spring-boot-starter-restclient`), Lombok, Jackson 3, and PostgreSQL at runtime.
- Main datasource defaults to PostgreSQL at `jdbc:postgresql://localhost:5432/presec_trensolar`, overridable via `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `JPA_DDL_AUTO`.
- Uploaded images go to `app.storage.location` (`uploads/` by default, resolved relative to `agtech-backend/`) and are served under `/uploads/**`; override with `FILE_STORAGE_LOCATION`. `agtech-backend/uploads/` is gitignored.
- Upload endpoint: `POST /api/sample-analyses` (multipart fields `batchId` and `file`); only JPEG/PNG/WEBP up to 10 MB. It runs the full synchronous analysis and returns the completed `InferenceResult`.
- Vision AI base URL defaults to `http://localhost:8000` and the client posts multipart field `file` to `/api/predict`; override with `VISION_AI_BASE_URL`. Timeouts are `app.vision-ai.connect-timeout` / `read-timeout`.
- `ImageAnalysisService` orchestrates the workflow (store image → persist `PROCESSING` → call Vision AI → persist `COMPLETED`); `SampleAnalysisService` owns the transactional persistence phases. Keep external HTTP calls out of JPA transactions.
- Vision AI failures mark the sample as `ERROR` and surface as HTTP 502; the stored image is retained for debugging/retry.
- Vision AI response fields must be snake_case (`export_percentage`, `discard_percentage`, `defect_details`, `heatmap_image_url`).
- Tests use in-memory H2 via `agtech-backend/src/test/resources/application.properties` and `target/test-uploads` for files; no external services are needed for `mvnw test`.
- No lint/format/checkstyle config, CI, or `opencode.json`; `mvnw test` is the only verification available.

## Commands (from `agtech-backend/`)

```bash
./mvnw test                                # full test suite
./mvnw test -Dtest=AgtechBackendApplicationTests # single test class
./mvnw spring-boot:run                     # run app
./mvnw clean package                       # build jar into target/
```

## Gotchas

- `agtech-backend/HELP.md` is listed in `agtech-backend/.gitignore`; edits to it are ignored by git.
- `agtech-backend/target/` is generated output; never edit it.
