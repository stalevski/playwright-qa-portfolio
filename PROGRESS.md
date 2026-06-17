# Project Progress & Working Notes

> Shared status file so this project can be picked up on any machine, by the
> author or a collaborator, without re-discovering context. Keep it short and
> current. For deep engineering rules see
> [TEST_AUTOMATION_STANDARDS.md](TEST_AUTOMATION_STANDARDS.md); for an overview
> see [README.md](README.md).

_Last updated: 2026-06-17_

---

## 1. Snapshot - what works today

- **Three test targets** are wired and runnable:
  - `swagger-petstore` - public API + UI (informational, can be flaky).
  - `sauce-demo` - public UI with `storageState` auth reuse (informational).
  - `pethub-local` - in-repo **Express + lowdb** app (deterministic, the
    primary target). UI + API + a11y.
- **~585 tests across 31 spec files** (367 dev across 18 files + 218 qa across 13).
- **CI** (`.github/workflows/playwright.yml`): `lint` → `test-local`
  (required) + `test-external` (informational, `continue-on-error`), plus a
  weekly cron to detect external-target drift.
- **Tooling**: ESLint 10 (flat config) + Prettier, Dependabot + auto-merge, `.nvmrc` (Node 24),
  `npm run doctor`, screenshot/PDF helper scripts.
- **AI assist**: `.windsurf/workflows/*` (plan / generate / heal / coverage /
  repo-revival), plus `AGENTS.md` + `.github/copilot-instructions.md`.

## 2. Resume on a new machine (checklist)

1. **Node version** - use Node 24 (see [.nvmrc](.nvmrc)). `nvm use` if available.
2. **Install deps** - `npm ci` (clean, lockfile-exact).
3. **Install browsers** - `npx playwright install` (add `--with-deps` on Linux/CI).
4. **Sanity check** - `npm run doctor` (prints node/npm/playwright versions and runs `tsc --noEmit`).
5. **Env (optional)** - defaults live in [test-targets.config.ts](test-targets.config.ts);
   copy [.env.example](.env.example) → `.env` only to override URLs.
6. **Smoke the local app** - `npm run app:start`, then open http://127.0.0.1:3000
   (admin), `/shop` (storefront), `/ops` (ops portal). Stop it before running the
   local suite, or let the suite manage it (`reuseExistingServer: true`).
7. **Run tests** - `npm test` (external then local), or `npm run test:local` for
   the deterministic suite only.

> See also `.windsurf/workflows/repo-revival.md` for the longer revival routine.

## 3. Test inventory by target

| Target             | UI  | API | a11y | Notes                                                                             |
| ------------------ | :-: | :-: | :--: | --------------------------------------------------------------------------------- |
| `pethub-local`     | ✅  | ✅  |  ✅  | Serial (`workers: 1`), lowdb single-file DB. Reset via `globalSetup`.             |
| `sauce-demo`       | ✅  |  -  |  -   | Auth via setup project + `storageState`. Includes documented known-defect tests.  |
| `swagger-petstore` | ✅  | ✅  |  -   | Public API asserts some buggy status codes (see `docs/swagger-petstore/bugs.md`). |

## 4. TODO / backlog

- [ ] Decide on `BasePage` helpers - adopt across pages or trim the unused ones.
- [ ] Expand a11y coverage beyond the current `pethub-local-a11y` project if desired.
- [ ] **Productionize PetHub Local** if we want to deploy it for real - see the
      staged plan in [§7](#7-deploying-pethub-local-as-a-real-app-design-note---continue-2026-06-17).

## 5. Known issues / tech-debt

| Item                      | Where                                                                        |     Severity     | Notes                                                                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------- | :--------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Regex-based SQL parser    | [src/helpers/sql/json-sql-database.ts](src/helpers/sql/json-sql-database.ts) | High (long-term) | Hand-rolled; narrow grammar (single join, `=` + `AND` only). New query shapes require extending the parser. Consider `sql.js`/`better-sqlite3` in-memory. |
| `BasePage` helpers unused | [src/core/ui/base.page.ts](src/core/ui/base.page.ts)                         |       Low        | Helpers used in ~1 of 20 pages; pages call `expect`/`locator` directly.                                                                                   |
| Magic seed IDs in tests   | `tests/local/pethub-local/**`                                                |       Low        | Hardcoded IDs (e.g. `1010`) couple tests to `database.seed.ts`. Mitigated by comments.                                                                    |

## 6. Decision log

> Append notable decisions here (date - decision - why) so context survives across machines and contributors.

- **2026-06-17** - **Refreshed the README Visual tour + screenshots and fixed
  stale spec paths.** Regenerated all 12 `docs/screenshots/*` images (via
  `npm run screenshots`) so they reflect the recent UI changes (two-tier nav with
  the current app as a non-clickable pill, the removed admin explorer
  login/logout forms, and the removed storefront "Sign in" nav link). The
  seed-data captions stayed accurate (still 18 pets: 12 available + 3 pending
  visible, 3 sold hidden; price ladder $35 Goldfish -> $2,800 French Bulldog).
  Added a sentence to the storefront-login caption documenting the new **persona
  defects** (`problem_user` dead sort / silent Birds add-to-cart / checkout
  last-name failure; `performance_user` latency; `standard_user` clean). Also
  corrected the README's stale `tests/dev/**` / `tests/qa/**` references to the
  actual `tests/local/**` / `tests/external/**` folders (renamed in commit
  547d8bf but missed in the README). Docs only; `format:check` clean.
- **2026-06-17** - **Made pet creation reject a duplicate id** instead of
  silently accepting it. The lowdb JSON store has no primary-key constraint and
  `createPet` did an unconditional `unshift`, so re-sending an existing id added a
  second record: single-id lookups (`getPetById`/`updatePet` use `.find`) then
  silently returned/edited the newest copy while list views showed both, and a
  single `deletePet` (filter-based) wiped every copy at once - an inconsistent,
  newest-wins shadow. Fix: `createPet` now throws a typed `DuplicatePetIdError`
  when the id already exists (enforced before any event/write). `POST /api/pets`
  catches it and returns **409 Conflict** (`respondConflict` helper); the admin
  **Create Pet** form catches it and redirects back to `/?error=...` showing an
  error toast (and `/?created=...` on success). Seeding bypasses `createPet`, and
  the QA `POST /api/v2/pets` computes `max(id)+1`, so neither can collide. Pinned
  by new tests: an API spec (duplicate id -> 409, original untouched, still one
  record) and an admin-ui spec (error toast, no duplicate row). Mirrors the real
  Swagger Petstore quirk this app is modelled on, where `addPet` is an unguarded
  create - documented in [docs/pethub-local/app.md](docs/pethub-local/app.md).
- **2026-06-17** - **Gave `problem_user` and `performance_user` real, intentional
  defects** so the storefront personas are a faithful self-hosted analog of Sauce
  Demo's broken accounts (previously they logged in and behaved exactly like
  `standard_user` - only `locked_out_user` differed). Added a `behavior` field to
  `StorefrontUser` / `StorefrontSession` carrying per-persona flags, copied onto
  the session at login. **`problem_user`**: the inventory **sort** updates the
  dropdown + URL but never reorders the grid; **Add to cart** is a silent no-op
  for the **Birds** category (the success toast still shows); **checkout** drops
  the Last Name server-side so it always fails "Last Name is required" even when
  filled. **`performance_user`**: the inventory + item pages sleep
  `PERFORMANCE_GLITCH_DELAY_MS` (1500ms) before responding. Every flag is off for
  `standard_user`, so the existing storefront specs are unaffected. Pinned by a
  new [tests/local/pethub-local/ui/storefront-personas.spec.ts](tests/local/pethub-local/ui/storefront-personas.spec.ts)
  (4 tests) that asserts the broken behaviour, and the persona docs in
  [docs/pethub-local/app.md](docs/pethub-local/app.md) were updated. The defects
  are deliberately **not** surfaced in the UI - discovering them is the exercise.
  This mirrors the existing external `known-defects.spec.ts` approach against the
  real Sauce Demo.
- **2026-06-16** - **Removed the confusing admin "User Login/Logout" explorer
  forms and the redundant storefront "Sign in" nav link.** Both were no-ops (a
  stateless session that never gated anything / a link back to the page you were
  already on), so they only confused testers; the `/api/users/*` API routes stay
  (still covered by the user-lifecycle API spec). These removals are part of why
  the refreshed screenshots differ.
- **2026-06-16** - **Reorganized the suite by ownership and grew the support
  layer.** `tests/local/pethub-local/{ui,api,a11y}` (our in-repo app) vs
  `tests/external/<target>/{ui,api}` (third-party targets); split `src/builders`
  into `objects/`, `requests/`, `expected/`; and closed storefront-cart +
  lab-widget coverage gaps while consolidating duplicate sort/theme tests. (The
  personas were documented as inert here, then given real defects on 2026-06-17,
  above.)
- **2026-06-14** - **Feature + polish wave** (all additive and deterministic,
  suites green): rewrote the README for readability; auth-gated the storefront
  section nav; added inline clinic-email validation; fixed the stale static-asset
  cache via ETag revalidation; fixed header/flyout/split-button bugs and added
  the `/lab/overlays` Popups & layers page; made all five surfaces mutually
  reachable, added the `/lab/menus` page and the whole **PetHub Clinic** vertical
  (its own in-memory store); reorganized `docs/` system-first; and added the **QA
  Test Lab** (`/lab` UI playground + `/api/lab` httpbin-style HTTP utilities).
- **2026-06-13** - Reworked navigation into a **two-tier header** (`renderAppBar`
  app bar + per-surface section tabs) and added a cross-platform `npm run stop`;
  added the v2 **platform API tier** (observability, bearer auth + RBAC, `422`
  validation, pagination, idempotency, `429` rate limiting, XSS sandbox, async
  jobs).
- **2026-06-11** - LTS/latest upgrade pass (Node 22 -> 24, ESLint 8 -> 10 flat
  config, Express 4 -> 5, NodeNext, Playwright 1.60) and broadened
  `@smoke`/`@critical` tag coverage to ~20 tests across all three targets.
- **2026-06-03/04** - Adopted `AGENTS.md` as the single AI source of truth;
  centralized storefront credentials in `src/helpers/test-data.ts` (off the
  Sauce-Demo values); clarified the admin Explorer login; bumped the Node pin
  20 -> 22 (EOL).
- **(earlier)** - Split Playwright into two configs - external (parallel,
  informational) and local (serial, `workers: 1`) - because lowdb is a single
  shared file that cannot tolerate concurrent writers.

## 7. Deploying PetHub Local as a real app (design note - continue 2026-06-17)

> Answer to "what if I want to deploy this as a real app?" PetHub Local is built
> as a **deterministic local QA sandbox**, not a hardened product, so a few
> sandbox shortcuts have to be undone first. This is the honest gap analysis plus
> a staged path, grounded in the current code. Nothing here is done yet - it is
> the plan to pick up next.

### 7.1 What "sandbox" means in the code today (the gaps to close)

- **Persistence is lowdb (a JSON file).** [database.ts](apps/pethub-local/database.ts),
  [read-models.ts](apps/pethub-local/read-models.ts) and
  [downstream-systems.ts](apps/pethub-local/downstream-systems.ts) each wrap a
  `Low` + `JSONFile` store under `apps/pethub-local/data/*.json`. Every mutation
  rewrites the **whole file**; there are no transactions, constraints, indexes or
  row locking. This is exactly why the suite runs serial (`workers: 1`) - see the
  last decision-log entry.
- **Auth is demo-grade.** The storefront keeps a hardcoded `storefrontUsers` array
  with **plaintext passwords** and renders them on the login page
  ([storefront.ts](apps/pethub-local/storefront/storefront.ts)); its sessions live
  in an **in-memory `Map`** (`storefrontSessions`), so they vanish on restart and
  cannot be shared across instances. The admin/API users sit in lowdb with a
  plaintext `password` field and `randomUUID` session tokens. There is no password
  hashing, CSRF protection, rate limiting on `/login`, security headers, or HTTPS
  cookie handling.
- **Runtime is a dev runner.** The app is started with `tsx`
  ([server.ts](apps/pethub-local/server.ts)) - great for iteration, but production
  should run compiled JS under a process supervisor. There is no `/healthz`, no
  graceful shutdown, no centralized error-handling middleware, and no structured
  logging.
- **Seed data is the data model.** `initializeDatabase` is idempotent (it only
  seeds empty collections, so data does persist across restarts), but the seeded
  demo accounts/catalog are baked in and the deterministic Playwright runs call
  `resetDatabase` to wipe state. A product needs a real empty-state vs. demo-seed
  distinction.

### 7.2 Why lowdb is fine locally but not in production

Single-file JSON is perfect for a hermetic, single-process test target: zero setup,
trivially resettable, diff-able. It breaks as a product backend because (a) writes
are whole-file, last-write-wins with no concurrency control; (b) there are no
transactions/constraints/indexes, so integrity is enforced only in app code; (c) it
is **single-node by definition** - run two instances and they clobber each other's
file; and (d) the file sits on the container's ephemeral disk, so a redeploy loses
data unless it is on a mounted volume.

### 7.3 The good news: the persistence seam already exists

The routes never touch lowdb directly - they call typed accessor functions
(`getPets`, `createOrder`, `loginUser`, ...) exported from the three store modules,
and the DTO/record types are already defined. So the "real persistence-layer
rewrite" is **bounded**: re-implement those functions behind a small repository
interface and swap the storage engine. The CQRS-style read-models and
downstream-systems projections map cleanly onto SQL views/materialized tables.

### 7.4 Staged path

**Tier 0 - prerequisites regardless of scale**

- Hash passwords (argon2 or bcrypt); stop storing plaintext; **remove the on-screen
  credential list**.
- Validate input at the boundary (e.g. `zod`) and add authorization checks on the
  admin/ops surfaces.
- Add `helmet`, `SameSite`/`HttpOnly`/`Secure` cookies, CSRF tokens on the form
  POSTs, and rate limiting on auth.
- Move config to validated env vars + a secret manager; never commit secrets.
- Compile TS → JS (tsc/esbuild) and run `node` on the build; add `/healthz`,
  graceful shutdown, `pino` logging, and an error-handling middleware.

**Tier 1 - "real but simple" (single small instance)**

- Swap lowdb for **SQLite** - `node:sqlite` (built into Node 24) or
  `better-sqlite3` - behind the repository interface from 7.3.
- Put sessions in a shared/persistent store (even a SQLite-backed session table or
  signed JWTs) instead of the in-memory `Map`.
- Add schema migrations (drizzle/knex) and a real seed command gated behind an env
  flag (no reset-on-boot in prod).
- Containerize (Dockerfile, non-root user) with the DB on a **persistent volume**;
  deploy to a single small host/platform (Fly.io, Render, Railway, a VPS) behind a
  reverse proxy with TLS.

**Tier 2 - scalable / multi-instance**

- Move to **Postgres** (managed) so the app tier is stateless and horizontally
  scalable; sessions in Redis.
- Promote read-models/downstream-systems to real projections (materialized views or
  a worker) instead of in-process sync.
- CI/CD that builds the image and **runs migrations on deploy**; add backups,
  metrics, log aggregation, and uptime/alerting.

### 7.5 Testing implications

The deterministic black-box suite depends on reset-per-run, which is fine to keep
**only against an ephemeral test DB** (already the case via `globalSetup`). For
prod, add migration tests and point the suite at a disposable SQLite/Postgres
instance rather than the live store.

### 7.6 Decision to make next

Pick the **target tier** first - "single small deployable instance" (Tier 1, the
smallest legitimately-deployable change) vs. "scalable service" (Tier 2). That
choice determines SQLite-vs-Postgres and whether session/projection work is needed
now or later. Everything in Tier 0 is required either way, so it is the safe place
to start tomorrow.
