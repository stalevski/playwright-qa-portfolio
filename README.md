# PetHub QA Lab

Playwright end-to-end and API automation framework for `https://petstore.swagger.io/`.

This repository now also includes a **local advanced Petstore app** with a local persistent database so you can practice against a deterministic target instead of a public demo site.

## Stack

- Playwright Test
- TypeScript
- Page Object Model
- Typed DTOs
- Builder-based test data

## Project structure

- `src/pages`
  - UI page objects
- `src/helpers`
  - API clients and test data helpers
- `src/core`
  - shared base page/client abstractions
- `src/fixtures`
  - system-specific Playwright fixture entry points
- `src/models/api`
  - DTO contracts
- `src/builders`
  - DTO builders
- `tests/targets/swagger-petstore/api`
  - Swagger Petstore API specs
- `tests/targets/swagger-petstore/ui`
  - Swagger Petstore UI specs
- `tests/targets/sauce-demo/ui`
  - Sauce Demo UI specs
- `tests/targets/pethub-local/api`
  - PetHub Local API specs
- `tests/targets/pethub-local/ui`
  - PetHub Local UI specs
- `apps/pethub-local`
  - PetHub Local Express + embedded-database app
- `.windsurf/workflows`
  - AI-assisted planning/generation/healing workflows

## PetHub Local app

The PetHub Local app provides:

- a web admin page at `/`
- local persistent pet, user, order, and audit-log data
- API endpoints under `/api`
- seeded demo data for stable automation

### PetHub Local endpoints

- `GET /api/health`
- `GET /api/pets`
- `GET /api/pets/:id`
- `GET /api/pets/:id/relations`
- `POST /api/pets`
- `PUT /api/pets/:id`
- `DELETE /api/pets/:id`
- `GET /api/users`
- `GET /api/users/:id`
- `GET /api/users/:id/relations`
- `POST /api/users`
- `GET /api/orders`
- `GET /api/orders/:id`
- `GET /api/orders/:id/relations`
- `POST /api/orders`
- `PATCH /api/orders/:id/status`
- `GET /api/audit-log`
- `GET /api/audit-log/relations`

### Install dependencies

```powershell
npm.cmd install
```

### Run PetHub Local app

```powershell
npm.cmd run app:start
```

### Stop local app

If you started it in the terminal, press:

```powershell
Ctrl + C
```

If it is running in a background terminal in the IDE, stop that terminal/process from the IDE terminal panel.

The app runs by default at:

- UI: `http://127.0.0.1:3000`
- API: `http://127.0.0.1:3000/api`

The PetHub Local app now also exposes relationship views so you can verify connected data between pets, users, orders, and audit entries.

### Target environment variables

Default target URLs are centralized in:

- `test-targets.config.ts`

Create a `.env` file from `.env.example` or use these values:

```dotenv
PUBLIC_BASE_URL=https://petstore.swagger.io
PUBLIC_API_BASE_URL=https://petstore.swagger.io/v2
LOCAL_BASE_URL=http://127.0.0.1:3000
LOCAL_API_BASE_URL=http://127.0.0.1:3000/api
```

## Test targets

The framework keeps **multiple systems under test**:

- Swagger Petstore
- Sauce Demo
- PetHub Local

The repo is organized by **system first** and then by **test type**, which is easier to scale in larger teams and multi-application automation portfolios.

They already use separate classes:

- Swagger Petstore UI page object: `src/pages/swagger-petstore/home.page.ts`
- Swagger Petstore API client: `src/helpers/api-clients/swagger-petstore-api.client.ts`
- Swagger Petstore fixtures: `src/fixtures/swagger-petstore/index.ts`
- Sauce Demo page objects: `src/pages/sauce-demo/*.page.ts`
- Sauce Demo fixtures: `src/fixtures/sauce-demo/index.ts`
- PetHub Local UI page object: `src/pages/pethub-local/home.page.ts`
- PetHub Local API client: `src/helpers/api-clients/pethub-local-api.client.ts`
- PetHub Local fixtures: `src/fixtures/pethub-local/index.ts`

Swagger Petstore specs live under `tests/targets/swagger-petstore`.

Sauce Demo specs live under `tests/targets/sauce-demo`.

PetHub Local specs live under `tests/targets/pethub-local`.

## Run tests

```powershell
npm.cmd test
```

For PetHub Local projects, Playwright now uses `webServer` to automatically start the app and reuse an already running instance when possible.

That means `test:pethub-local`, `test:pethub-local:ui`, and `test:pethub-local:api` no longer require you to manually start the app first.

Run only the Swagger Petstore suite:

```powershell
npm.cmd run test:swagger-petstore
```

Run only the Sauce Demo suite:

```powershell
npm.cmd run test:sauce-demo
```

Run only the PetHub Local suite:

```powershell
npm.cmd run test:pethub-local
```

Run only the Swagger Petstore API suite:

```powershell
npm.cmd run test:swagger-petstore:api
```

Run only the Sauce Demo UI suite:

```powershell
npm.cmd run test:sauce-demo:ui
```

Run only the PetHub Local API suite:

```powershell
npm.cmd run test:pethub-local:api
```

Run only the Swagger Petstore UI suite:

```powershell
npm.cmd run test:swagger-petstore:ui
```

Run only the PetHub Local UI suite:

```powershell
npm.cmd run test:pethub-local:ui
```

### Parallel execution note

The Playwright config keeps parallel execution enabled for normal framework usage.

The `pethub-local` target uses a shared local Express app with JSON-backed persistence files. Because of that, full-suite highly parallel execution can expose shared-state issues when multiple local UI/API tests mutate the same data at the same time.

If you hit intermittent local-only failures during a full parallel run, prefer one of these approaches:

- run the affected `pethub-local` spec or target in isolation
- run the local UI or local API suite separately
- temporarily reduce workers when validating the local target

UI only:

```powershell
& "C:\Program Files\nodejs\node.exe" .\node_modules\playwright\cli.js test tests/targets/swagger-petstore/ui tests/targets/pethub-local/ui
```

API only:

```powershell
& "C:\Program Files\nodejs\node.exe" .\node_modules\playwright\cli.js test tests/targets/swagger-petstore/api tests/targets/pethub-local/api
```

## AI-assisted workflow

This repository keeps **explicit Playwright code** as the source of truth. AI is intended to assist with planning, generation, analysis, and coverage review.

### Available workflows

- `.windsurf/workflows/ai-test-planner.md`
  - turn requirements into a concrete test plan
- `.windsurf/workflows/ai-test-generator.md`
  - generate code that matches repo conventions
- `.windsurf/workflows/ai-test-healer.md`
  - analyze failures and propose minimal fixes
- `.windsurf/workflows/ai-coverage-assistant.md`
  - review existing test coverage and identify gaps

### Recommended usage pattern

1. Use the planner to define scenarios.
2. Use the generator to produce draft code.
3. Review generated changes.
4. Run Playwright.
5. Use the healer only when failures need investigation.
6. Periodically use the coverage assistant to spot gaps.

### Important principle

Do **not** treat AI-generated steps as the runtime test layer. Keep committed tests as readable Playwright code with page objects, API clients, DTOs, and builders.
