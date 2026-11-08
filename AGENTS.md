# AGENTS.md

## Layout

- Only the Spring Boot app in `backend/` exists; there is no frontend or other module yet.
- Maven wrapper and `pom.xml` live in `backend/`, so run all build commands from `backend/` (not the repo root).
- Main class: `backend/src/main/java/com/app/backend/BackendApplication.java`; package root is `com.app.backend`.
- Domain model lives in `backend/src/main/java/com/app/backend/domain/` (`entity/` and `enums/`); repositories in `repository/`, business logic in `service/`, HTTP layer in `web/`, outbound integrations in `integration/`, and config in `config/`.
- Vision AI client lives in `integration/VisionIAClientService.java`; its DTO is in `integration/dto/`.

## Toolchain

- Java 17 (`<java.version>17</java.version>`) and Spring Boot 4.1.2 / Hibernate 7.4 — check Boot 4 APIs, not Boot 3 examples.
- Uses JPA (`spring-boot-starter-data-jpa`), Spring MVC (`spring-boot-starter-webmvc`), `RestClient` (`spring-boot-starter-restclient`), Lombok, Jackson 3, and PostgreSQL at runtime.
- Main datasource defaults to PostgreSQL at `jdbc:postgresql://localhost:5432/presec_trensolar`, overridable via `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `JPA_DDL_AUTO`.
- Uploaded images go to `app.storage.location` (`uploads/` by default, resolved relative to `backend/`) and are served under `/uploads/**`; override with `FILE_STORAGE_LOCATION`. `backend/uploads/` is gitignored.
- Upload endpoint: `POST /api/sample-analyses` (multipart fields `batchId` and `file`); only JPEG/PNG/WEBP up to 10 MB. It runs the full synchronous analysis and returns the completed `InferenceResult`.
- Vision AI base URL defaults to `http://localhost:8000` and the client posts multipart field `file` to `/api/predict`; override with `VISION_AI_BASE_URL`. Timeouts are `app.vision-ai.connect-timeout` / `read-timeout`.
- `ImageAnalysisService` orchestrates the workflow (store image → persist `PROCESSING` → call Vision AI → persist `COMPLETED`); `SampleAnalysisService` owns the transactional persistence phases. Keep external HTTP calls out of JPA transactions.
- Vision AI failures mark the sample as `ERROR` and surface as HTTP 502; the stored image is retained for debugging/retry.
- Vision AI response fields must be snake_case (`export_percentage`, `discard_percentage`, `defect_details`, `heatmap_image_url`).
- Tests use in-memory H2 via `backend/src/test/resources/application.properties` and `target/test-uploads` for files; no external services are needed for `mvnw test`.
- No lint/format/checkstyle config, CI, or `opencode.json`; `mvnw test` is the only verification available.

## Commands (from `backend/`)

```bash
./mvnw test                                # full test suite
./mvnw test -Dtest=BackendApplicationTests # single test class
./mvnw spring-boot:run                     # run app
./mvnw clean package                       # build jar into target/
```

## Gotchas

- `backend/HELP.md` is listed in `backend/.gitignore`; edits to it are ignored by git.
- `backend/target/` is generated output; never edit it.
