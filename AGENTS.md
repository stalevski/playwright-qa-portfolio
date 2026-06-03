# AGENTS.md

Guidance for AI coding agents working in this repository. This is the **single
source of truth** for agents. Tool-specific files (e.g.
`.github/copilot-instructions.md`) are thin pointers back to this file.

## What this project is

A TypeScript + Playwright **QA automation portfolio** exercising three target
systems:

- **`pethub-local`** — an in-repo **Express + lowdb** app (`apps/pethub-local/`).
  Deterministic and self-owned; this is the **primary** target for full-stack QA
  (UI, API, accessibility, CQRS-style read models, downstream replicas).
- **`swagger-petstore`** — public API + UI. Informational; may be flaky. Some
  tests deliberately assert known-buggy behavior (see `docs/swagger-petstore-bugs.md`).
- **`sauce-demo`** — public UI with `storageState` auth reuse. Informational;
  includes documented known-defect tests (`docs/sauce-demo-bugs.md`).

## Source-of-truth documents (read these)

- **Engineering standards** — [TEST_AUTOMATION_STANDARDS.md](TEST_AUTOMATION_STANDARDS.md).
  Authoritative for structure, page objects, components, locators, fixtures, test
  data, and refactor-vs-patch decisions. Follow it.
- **Overview & setup** — [README.md](README.md).
- **Status, backlog, tech-debt** — [PROGRESS.md](PROGRESS.md). Update it when you
  finish meaningful work or discover/resolve tech-debt.
- **AI task playbooks** — `.windsurf/workflows/` (planner, generator, healer,
  coverage assistant, repo-revival). Reuse these flows; don't duplicate them.

## Architecture map

Organized **system-first, then test-type**.

```
apps/pethub-local/        Express + lowdb app (server, routes, data, admin/ops/storefront)
src/
  core/                   base.page.ts, base-api.client.ts, global-setup.ts
  pages/<system>/         page objects (one per real screen); components/ for shared UI
  helpers/api-clients/    typed API clients (extend BaseApiClient)
  fixtures/<system>/      Playwright test.extend fixtures (re-export expect)
  builders/               fluent DTO builders (pet, order, user)
  models/api/             DTOs / typed transport
  helpers/                a11y, test-data, unique-id, random-data-generator, sql/
tests/targets/<system>/{ui,api,a11y}/   specs
test-targets.config.ts    URL registry with env overrides + defaults
playwright.config.ts          external targets (parallel)
playwright.local.config.ts    pethub-local (serial, workers:1, webServer, globalSetup)
```

Path aliases (see `tsconfig.json`): `@config`, `@core/*`, `@pages/*`,
`@helpers/*`, `@fixtures/*`, `@data/*`, `@models/*`, `@builders/*`.

## How to run

| Goal                        | Command                                                           |
| --------------------------- | ----------------------------------------------------------------- |
| Start local app             | `npm run app:start` (UI on `127.0.0.1:3000`)                      |
| Sanity check                | `npm run doctor`                                                  |
| All tests                   | `npm test` (external then local)                                  |
| Local suite (deterministic) | `npm run test:local`                                              |
| External suite              | `npm run test:external`                                           |
| By target                   | `npm run test:pethub-local` / `:sauce-demo` / `:swagger-petstore` |
| a11y                        | `npm run test:a11y`                                               |
| Lint / format               | `npm run lint` · `npm run format:check`                           |

Node 20 (see `.nvmrc`). The local config runs `workers: 1` because lowdb is a
single shared JSON file; do not parallelize local tests.

## Conventions agents must follow

- **Priorities** (from the standards): readability → maintainability → enterprise
  patterns → strongest locator stability. Prefer long-term clarity over the
  fastest patch.
- **Locators**: prefer app-owned test ids (`data-test`), then roles + accessible
  names, then labels/placeholders, then scoped text. Avoid brittle text-only
  selectors, long CSS chains, and XPath for ordinary UI.
- **Page objects**: extend `BasePage`; `readonly` locators set in the constructor;
  provide `goto()`/`assertLoaded()` and intention-revealing actions. No raw
  selectors in specs.
- **API**: use typed clients extending `BaseApiClient`; DTOs for transport;
  builders/factories for data. Follow AAA and assert business outcomes.
- **Async hygiene**: use `waitForURL`, `Promise.all/race`, and `expect.poll` for
  eventual consistency — avoid arbitrary waits.
- **Known-defect tests** assert _current buggy behavior_ on purpose; keep them
  clearly labeled and cross-referenced to `docs/*-bugs.md`.

## Validation before declaring done

1. `npm run lint` and `npm run format:check` pass.
2. `npx tsc --noEmit` clean (covered by `npm run doctor`).
3. Run the focused suite for the affected target (e.g. `npm run test:local`).
4. Update [PROGRESS.md](PROGRESS.md) if status, backlog, or tech-debt changed.

## Guardrails

- Don't add features, refactors, or abstractions beyond what's requested.
- Don't commit secrets; real `.env` is gitignored (defaults live in
  `test-targets.config.ts`).
- Keep external-target flakiness informational — never make it block CI.
