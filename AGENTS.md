# AGENTS.md

Guidance for AI coding agents working in this repository. This is the **single
source of truth** for agents. AI coding tools (GitHub Copilot, Claude Code,
Cursor, Devin, etc.) read this file directly, so no per-tool instruction files
are maintained.

## What this project is

A TypeScript + Playwright **QA automation portfolio** exercising three target
systems:

- **`pethub-local`** - an in-repo **Express + lowdb** app (`apps/pethub-local/`).
  Deterministic and self-owned; this is the **primary** target for full-stack QA
  (UI, API, accessibility, CQRS-style read models, downstream replicas).
- **`swagger-petstore`** - public API + UI. Informational; may be flaky. Some
  tests deliberately assert known-buggy behavior (see `docs/swagger-petstore/bugs.md`).
- **`sauce-demo`** - public UI with `storageState` auth reuse. Informational;
  includes documented known-defect tests (`docs/sauce-demo/bugs.md`).

## Source-of-truth documents (read these)

- **Engineering standards** - [TEST_AUTOMATION_STANDARDS.md](TEST_AUTOMATION_STANDARDS.md).
  Authoritative for structure, page objects, components, locators, fixtures, test
  data, and refactor-vs-patch decisions. Follow it.
- **Overview & setup** - [README.md](README.md).
- **Status, backlog, tech-debt** - [PROGRESS.md](PROGRESS.md). Update it when you
  finish meaningful work or discover/resolve tech-debt.
- **AI task playbooks** - `docs/workflows/` (planner, generator, healer,
  coverage assistant, repo-revival, formatting-cleanup). Reuse these flows;
  don't duplicate them.

## Architecture map

Organized **system-first, then test-type**.

```
apps/pethub-local/        Express + lowdb app (server, routes, data, admin/ops/storefront)
                          platform.ts = v2 QA surfaces (auth, validation, pagination,
                          rate-limit, jobs, idempotency, security, observability)
                          lab/ = QA Test Lab: /lab UI playground (forms, dynamic,
                          dialogs, tables, widgets, frames, shadow DOM) + /api/lab
                          httpbin-style stateless HTTP utilities
                          data-paths.ts = resolution of the three lowdb stores
                          (PETHUB_DATA_DIR override for isolated runs)
src/
  core/                   base.page.ts, base-api.client.ts, global-setup.ts
  pages/<system>/         page objects (one per real screen); components/ for shared UI
  helpers/api-clients/    typed API clients (extend BaseApiClient)
  fixtures/<system>/      Playwright test.extend fixtures (re-export expect)
  builders/               fluent test-data builders: objects/ (pet, order, user),
                          requests/ + expected/ for API payloads & assertions
  models/api/             DTOs / typed transport
  helpers/                a11y, test-data, unique-id, random-data-generator, sql/
tests/local/pethub-local/{ui,api,a11y}/   specs for our own in-repo app
tests/external/<system>/{ui,api}/            specs for external third-party targets
test-targets.config.ts    URL registry with env overrides + defaults
playwright.config.ts          external targets (parallel)
playwright.local.config.ts    pethub-local (serial, workers:1, webServer, globalSetup)
```

Path aliases (see `tsconfig.json`): `@config`, `@core/*`, `@pages/*`,
`@helpers/*`, `@fixtures/*`, `@data/*`, `@models/*`, `@builders/*`.

## How to run

| Goal                        | Command                                                             |
| --------------------------- | ------------------------------------------------------------------- |
| Start local app             | `npm run app:start` (UI on `127.0.0.1:3000`)                        |
| Stop local app              | `npm run stop` (frees port 3000, cross-platform)                    |
| Sanity check                | `npm run doctor`                                                    |
| **Full gate (before done)** | `npm run verify` (lint + format + typecheck + local suite)          |
| Typecheck only              | `npm run typecheck`                                                 |
| All tests                   | `npm test` (external then local)                                    |
| Local suite (deterministic) | `npm run test:local`                                                |
| Local suite, random order   | `npm run test:shuffle` (order-independence check)                   |
| External suite              | `npm run test:external`                                             |
| By target                   | `npm run test:pethub-local` / `:sauce-demo` / `:swagger-petstore`   |
| a11y                        | `npm run test:a11y`                                                 |
| Retry last failures         | `npm run test:failed:local` (nothing to run if the last run passed) |
| Lint / format               | `npm run lint` · `npm run format:check`                             |
| Doc link check              | `npm run docs:check` (verified targets for every relative link)     |

Node 24 (see `.nvmrc`). The local config runs `workers: 1` because lowdb is a
single shared JSON file; do not parallelize local tests.

`npm run verify` is the single deterministic gate for the whole repo - one
command, one exit code. It composes `lint` + `format:check` + `typecheck` +
`docs:check` + `test:local`, and excludes the external targets on purpose: those
are informational and their flakiness must not gate correctness. Machine-readable
results land in `test-results/results.json` and `test-results-local/results.json`
(both gitignored) so failures can be parsed instead of scraped from the HTML
report.

### Running in isolation (concurrent runs, worktrees, agents)

The local app defaults to port 3000 and `apps/pethub-local/data/`, so two runs
sharing those collide. A second instance needs `LOCAL_BASE_URL` (moves the
origin; `LOCAL_API_BASE_URL` derives from it) and `PETHUB_DATA_DIR` (relocates
all three lowdb stores away from the repo). Exact recipe:
[docs/pethub-local/testing.md](docs/pethub-local/testing.md#running-two-instances-at-once).

Isolation makes separate **runs** safe. It does not make parallel **specs** safe

- keep the local suite serial (`workers: 1`).

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
  eventual consistency - avoid arbitrary waits.
- **Known-defect tests** assert _current buggy behavior_ on purpose; keep them
  clearly labeled, tagged `@known-defect`, and cross-referenced to
  `docs/<system>/bugs.md`. Never "fix" one to make it pass - it is written to
  fail the day the defect is genuinely fixed. List them with
  `npx playwright test --grep @known-defect --list` (add
  `--config playwright.local.config.ts` for the in-repo app).

## Validation before declaring done

1. `npm run verify` passes. It is the composed gate: `lint` + `format:check` +
   `typecheck` + `docs:check` + `test:local`. Run the pieces individually only
   while iterating.
2. If you changed anything under `src/`, `tests/`, or `apps/`, the local suite
   must actually run - a green lint is not evidence.
3. Prefer `npm run test:failed:local` to re-run just the previous failures when
   iterating, then finish with a full `npm run verify`.
4. A `globalSetup` failure is fatal and means the database was not reset. Fix the
   cause (stale instance holding port 3000, or a shared `PETHUB_DATA_DIR`) - do
   not work around it, because every later assertion would run against unknown
   state.
5. **Update the docs in the same change - do not wait to be asked.** Whenever
   behavior, structure, commands, surfaces, or test coverage change, update every
   affected Markdown file as part of the work:
   - [PROGRESS.md](PROGRESS.md) - status, backlog, tech-debt, and the decision log.
   - [README.md](README.md) - setup, commands, and the surface/feature overview.
   - `docs/<system>/*.md` - e.g. [docs/pethub-local/app.md](docs/pethub-local/app.md)
     and [docs/pethub-local/testing.md](docs/pethub-local/testing.md) for app
     behavior, routes, endpoints, and the test inventory.
   - This file (`AGENTS.md`) and
     [TEST_AUTOMATION_STANDARDS.md](TEST_AUTOMATION_STANDARDS.md) when conventions
     or workflows change.

   Treat docs as part of "done": a code change that leaves the Markdown stale is
   incomplete. Run `npm run format:check` so doc formatting passes too.

## Guardrails

- Don't add features, refactors, or abstractions beyond what's requested.
- Don't commit secrets; real `.env` is gitignored (defaults live in
  `test-targets.config.ts`).
- Keep external-target flakiness informational - never make it block CI.
