# Project Progress & Working Notes

> Shared status file so this project can be picked up on any machine, by the
> author or a collaborator, without re-discovering context. Keep it short and
> current. For deep engineering rules see
> [TEST_AUTOMATION_STANDARDS.md](TEST_AUTOMATION_STANDARDS.md); for an overview
> see [README.md](README.md).

_Last updated: 2026-06-11_

---

## 1. Snapshot — what works today

- **Three test targets** are wired and runnable:
  - `swagger-petstore` — public API + UI (informational, can be flaky).
  - `sauce-demo` — public UI with `storageState` auth reuse (informational).
  - `pethub-local` — in-repo **Express + lowdb** app (deterministic, the
    primary target). UI + API + a11y.
- **~130–145 tests across ~20 spec files.**
- **CI** (`.github/workflows/playwright.yml`): `lint` → `test-local`
  (required) + `test-external` (informational, `continue-on-error`), plus a
  weekly cron to detect external-target drift.
- **Tooling**: ESLint 10 (flat config) + Prettier, Dependabot + auto-merge, `.nvmrc` (Node 24),
  `npm run doctor`, screenshot/PDF helper scripts.
- **AI assist**: `.windsurf/workflows/*` (plan / generate / heal / coverage /
  repo-revival), plus `AGENTS.md` + `.github/copilot-instructions.md`.

## 2. Resume on a new machine (checklist)

1. **Node version** — use Node 24 (see [.nvmrc](.nvmrc)). `nvm use` if available.
2. **Install deps** — `npm ci` (clean, lockfile-exact).
3. **Install browsers** — `npx playwright install` (add `--with-deps` on Linux/CI).
4. **Sanity check** — `npm run doctor` (prints node/npm/playwright versions and runs `tsc --noEmit`).
5. **Env (optional)** — defaults live in [test-targets.config.ts](test-targets.config.ts);
   copy [.env.example](.env.example) → `.env` only to override URLs.
6. **Smoke the local app** — `npm run app:start`, then open http://127.0.0.1:3000
   (admin), `/shop` (storefront), `/ops` (ops portal). Stop it before running the
   local suite, or let the suite manage it (`reuseExistingServer: true`).
7. **Run tests** — `npm test` (external then local), or `npm run test:local` for
   the deterministic suite only.

> See also `.windsurf/workflows/repo-revival.md` for the longer revival routine.

## 3. Test inventory by target

| Target             | UI  | API | a11y | Notes                                                                             |
| ------------------ | :-: | :-: | :--: | --------------------------------------------------------------------------------- |
| `pethub-local`     | ✅  | ✅  |  ✅  | Serial (`workers: 1`), lowdb single-file DB. Reset via `globalSetup`.             |
| `sauce-demo`       | ✅  |  —  |  —   | Auth via setup project + `storageState`. Includes documented known-defect tests.  |
| `swagger-petstore` | ✅  | ✅  |  —   | Public API asserts some buggy status codes (see `docs/swagger-petstore-bugs.md`). |

## 4. TODO / backlog

- [x] Broaden `@smoke` / `@critical` tag coverage so grep-based CI selection is meaningful.
- [x] Add `SAUCE_DEMO_BASE_URL` to [.env.example](.env.example) (read in `test-targets.config.ts`).
- [ ] Decide on `BasePage` helpers — adopt across pages or trim the unused ones.
- [x] Add a `patch()` verb to `BaseApiClient` and refactor `updateOrderStatus` to use it.
- [ ] Expand a11y coverage beyond the current `pethub-local-a11y` project if desired.
- [x] Migrate ESLint 8 (EOL) → flat config + bump `typescript-eslint` (done 2026-06-11; went straight to ESLint 10 + typescript-eslint v8).

## 5. Known issues / tech-debt

| Item                      | Where                                                                        |     Severity     | Notes                                                                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------- | :--------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Regex-based SQL parser    | [src/helpers/sql/json-sql-database.ts](src/helpers/sql/json-sql-database.ts) | High (long-term) | Hand-rolled; narrow grammar (single join, `=` + `AND` only). New query shapes require extending the parser. Consider `sql.js`/`better-sqlite3` in-memory. |
| `BasePage` helpers unused | [src/core/ui/base.page.ts](src/core/ui/base.page.ts)                         |       Low        | Helpers used in ~1 of 20 pages; pages call `expect`/`locator` directly.                                                                                   |
| Magic seed IDs in tests   | `tests/targets/**`                                                           |       Low        | Hardcoded IDs (e.g. `1010`) couple tests to `database.seed.ts`. Mitigated by comments.                                                                    |

## 6. Decision log

> Append notable decisions here (date — decision — why) so context survives across machines and contributors.

- **2026-06-11 (later)** — LTS/latest upgrade pass: Node pin 22 → 24 (`.nvmrc` + `engines`),
  ESLint 8 → 10 with flat config (`.eslintrc.cjs` → `eslint.config.mjs`, typescript-eslint v8
  meta-package), Express 4 → 5 (no breaking route patterns in the app), Playwright 1.60,
  dotenv 17, marked/prettier/tsx latest. Also migrated `tsconfig.json` off deprecated `baseUrl` +
  `moduleResolution: Node` (TS 6 deprecations) to relative `paths` + NodeNext. Verified: lint
  clean, doctor OK, `test:local` 113 passed.
- **2026-06-11** — Broadened `@smoke`/`@critical` tag coverage from 8 to ~20 tests across all
  three targets (core journeys: checkout, cart, pet/order/user CRUD, DB validation, ops portal
  overview) so `--grep @smoke` / `--grep @critical` CI selection is meaningful. Also fixed stale
  README facts: Node engines `>=20` → `>=22` and screenshot count 10 → 9 (the script captures 9;
  there is no `02-*` image). Verified: lint clean, `npm run test:local` 113 passed.
- **2026-06-04** — Clarified the admin **Swagger-style Explorer** login for humans:
  added a caption noting the Petstore-style login is intentionally stateless (records
  a session but does not gate the dashboard) and an active-session badge
  (`data-test="explorer-session-status"`) so the action has visible feedback. Backed
  by a read-only `getActiveSession` query; no change to the API/test contract.
  Inline result panels were considered but deferred (needs client JS + would touch UI
  test expectations).
- **2026-06-04** — Bumped Node pin 20 → 22 (`.nvmrc`, `engines`, docs) because
  Node 20 reached end-of-life (~April 2026); 22 is Active LTS. CI installs from
  `.nvmrc`, so this moves CI off an EOL runtime.
- **2026-06-04** — Centralized `pethub-local` storefront credentials in
  [src/helpers/test-data.ts](src/helpers/test-data.ts) (`pethubLocalUsers` /
  `pethubLocalPassword`); specs and the screenshot script import them. The app
  ([storefront.ts](apps/pethub-local/storefront/storefront.ts)) keeps its own
  copy as the runtime source of truth. Storefront password changed off the
  Sauce-Demo value, and login error copy rebranded away from `Epic sadface:`.
- **2026-06-03** — Adopted `AGENTS.md` as the single source of truth for AI agents;
  `.github/copilot-instructions.md` is a thin pointer. Deep rules stay in
  `TEST_AUTOMATION_STANDARDS.md`. Windsurf workflows retained as task playbooks.
- **(earlier)** — Split Playwright into two configs: external (parallel,
  informational) and local (serial, `workers: 1`) because lowdb is a single shared
  file and cannot tolerate concurrent writes.
