# AGENTS.md

## Layout

- Only the Spring Boot app in `backend/` exists; there is no frontend or other module yet.
- Maven wrapper and `pom.xml` live in `backend/`, so run all build commands from `backend/` (not the repo root).
- Main class: `backend/src/main/java/com/app/backend/BackendApplication.java`; package root is `com.app.backend`.
- Domain model lives in `backend/src/main/java/com/app/backend/domain/` (`entity/` and `enums/`).

## Toolchain

- Java 17 (`<java.version>17</java.version>`) and Spring Boot 4.1.2 / Hibernate 7.4 — check Boot 4 APIs, not Boot 3 examples.
- Uses JPA (`spring-boot-starter-data-jpa`), Lombok, Jackson 3, and PostgreSQL at runtime. This is still **not a web app**: adding `@RestController` will not expose endpoints until `spring-boot-starter-web` is added.
- Main datasource defaults to PostgreSQL at `jdbc:postgresql://localhost:5432/presec_trensolar`, overridable via `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `JPA_DDL_AUTO`.
- Tests use in-memory H2 via `backend/src/test/resources/application.properties`; no external database is needed for `mvnw test`.
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
