# Project Progress & Working Notes

> Shared status file so this project can be picked up on any machine, by the
> author or a collaborator, without re-discovering context. Keep it short and
> current. For deep engineering rules see
> [TEST_AUTOMATION_STANDARDS.md](TEST_AUTOMATION_STANDARDS.md); for an overview
> see [README.md](README.md).

_Last updated: 2026-06-16_

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

- [x] Broaden `@smoke` / `@critical` tag coverage so grep-based CI selection is meaningful.
- [x] Add `SAUCE_DEMO_BASE_URL` to [.env.example](.env.example) (read in `test-targets.config.ts`).
- [ ] Decide on `BasePage` helpers - adopt across pages or trim the unused ones.
- [x] Add a `patch()` verb to `BaseApiClient` and refactor `updateOrderStatus` to use it.
- [ ] Expand a11y coverage beyond the current `pethub-local-a11y` project if desired.
- [ ] **Productionize PetHub Local** if we want to deploy it for real - see the
      staged plan in [§7](#7-deploying-pethub-local-as-a-real-app-design-note---continue-2026-06-17).
- [x] Migrate ESLint 8 (EOL) → flat config + bump `typescript-eslint` (done 2026-06-11; went straight to ESLint 10 + typescript-eslint v8).

## 5. Known issues / tech-debt

| Item                      | Where                                                                        |     Severity     | Notes                                                                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------- | :--------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Regex-based SQL parser    | [src/helpers/sql/json-sql-database.ts](src/helpers/sql/json-sql-database.ts) | High (long-term) | Hand-rolled; narrow grammar (single join, `=` + `AND` only). New query shapes require extending the parser. Consider `sql.js`/`better-sqlite3` in-memory. |
| `BasePage` helpers unused | [src/core/ui/base.page.ts](src/core/ui/base.page.ts)                         |       Low        | Helpers used in ~1 of 20 pages; pages call `expect`/`locator` directly.                                                                                   |
| Magic seed IDs in tests   | `tests/dev/pethub-local/**`                                                  |       Low        | Hardcoded IDs (e.g. `1010`) couple tests to `database.seed.ts`. Mitigated by comments.                                                                    |

## 6. Decision log

> Append notable decisions here (date - decision - why) so context survives across machines and contributors.

- **2026-06-16** - **Split specs into dev vs qa and grew the support layer.**
  Regrouped the suite by _what is under test_: `tests/dev/pethub-local/{ui,api,a11y}`
  for our own in-repo app and `tests/qa/<external>/{ui,api}` for third-party
  targets (swagger-petstore, sauce-demo). Both Playwright configs' `testMatch`,
  the `npm` scripts (canonical `test:dev`/`test:qa`, with `test:local`/`test:external`
  kept as aliases) and the CI job names now follow that split; no test was
  rewritten, only moved. Reorganized `src/builders` into `objects/` (Pet/Order/User
  DTO builders) and added fully independent `requests/`
  (`ClinicAppointmentRequestBuilder`, `LocalPetRequestBuilder`) and `expected/`
  (`ValidationErrorExpectationBuilder`) families, wired into the clinic + platform
  API specs so they are not dead code.
- **2026-06-16** - **Closed storefront cart + lab widget coverage gaps and trimmed
  duplication.** Added `storefront-cart-selection.spec.ts` (distinct-card badge
  counts, repeat-add quantity accumulation, multi-item subtotal, add-from-details,
  sold pets not selectable) plus accordion / toast-auto-dismiss / clipboard-copy
  tests to the lab Widgets suite, backed by new `data-test` hooks
  (`cart-item-quantity`, `cart-line-total`, `cart-subtotal`) on the storefront
  cart render. Consolidated the four storefront sort tests into one parameterized
  scenario table and dropped the admin functional theme-toggle test - the shared
  toggle is already covered functionally on the storefront (with persistence +
  `aria-pressed`) and geometrically on every surface by `header-layout.spec.ts` -
  so maintenance cost drops without losing coverage. All tests stay black-box
  Playwright (no white-box/unit layer added).
- **2026-06-14** - **Rewrote the README for readability.** It had grown to ~680
  lines with the revival checklist near the top, ~15 near-identical
  `npm run test:*` blocks, and full endpoint dumps inline. Restructured
  shallow→deep: badges + a one-paragraph pitch, a table of contents, a
  **Quickstart** first, "What's inside", the visual tour, then
  architecture/reference, a single **command table** for the test scripts, and
  the maintenance/revival checklist moved to the end. Exhaustive endpoint lists
  now link to `docs/pethub-local/app.md`; switched `npm.cmd` → `npm` to match
  AGENTS.md; and corrected the a11y coverage list to include Clinic and the QA
  Test Lab. Down to ~403 lines; `format:check` passes.
- **2026-06-14** - **Auth-gated the storefront section nav.** The Inventory, Cart
  and Checkout links were rendered for everyone, including the logged-out login
  page, even though all three routes redirect back to `/shop` without a session.
  `renderStorefrontLayout` now only emits those links when a session is present;
  logged out, the section nav shows just the "Sign in" action. Added a
  `storefront-ui.spec.ts` regression test asserting the links are hidden before
  login and visible after.
- **2026-06-14** - Improved the **clinic booking email UX**: the email was only
  validated server-side on final submit, so "A valid email is required" appeared
  at the very end of the four-step wizard. Added **inline, field-level
  validation** on the details step (`clinic.js`): a malformed address now shows
  the message on the field itself (with `aria-invalid` + `role="alert"`) on blur
  and when clicking Next, clears live once corrected, and blocks advancing to
  review. The JS regex mirrors `validateAppointment` in `clinic.ts` so the wizard
  and the server agree; the server check stays as the no-JS safety net. Added a
  `clinic-email-error` hook, an `emailError` page-object locator, a `.field-error`
  style, and a `clinic-ui.spec.ts` test.
- **2026-06-14** - Fixed a **stale static-asset cache** bug. The `/static`
  middleware served JS/CSS with `Cache-Control: public, max-age=3600`, but the
  asset URLs are fixed and un-hashed (e.g. `/static/lab.js`), so after any change
  the browser kept running the cached copy for up to an hour without
  revalidating - making new behaviour (e.g. the Popups & layers handlers) appear
  completely dead even though the server was serving the new file. Switched
  `express.static` to ETag/Last-Modified revalidation (`Cache-Control: no-cache`
  via `setHeaders`), so the browser always revalidates and gets a fast `304` when
  unchanged or fresh content the instant a file changes. Verified in-browser
  (popover/toasts/z-index now respond) and via lint + `format:check` +
  `tsc --noEmit` clean.
- **2026-06-14** - Fixed three reported header/menu bugs (each with a regression
  test) and added a **Popups & layers** Test Lab page. (1) **Toolbar shift /
  overlap**: the theme-toggle label ("Dark mode" ↔ "Light mode") changed width
  and reflowed the flex-end app-bar cluster, and the non-wrapping `.app-bar`
  collided with the tools at tight widths. Fixed in `theme.css` (`.app-bar`
  flex-wrap, `.brand { min-width: 0; flex: 1 1 16rem }`, toggle-label
  `min-width: 6em`) and locked in by a geometric guard
  [header-layout.spec.ts](tests/dev/pethub-local/ui/header-layout.spec.ts)
  (bounding-box overlap = 0 and zero header/toggle shift on theme toggle, across
  five surfaces × four widths). (2) **Flyout overlap**: both top-level submenus
  could open at once with equal `z-index`, so Services painted over Products'
  items; `lab.js` now enforces WAI-ARIA single-open behaviour
  (`closeSiblingMenus`). (3) **Split button**: choosing a dropdown option now
  becomes the new default (the primary label updates), matching GitHub/VS Code
  behaviour. (4) New **`/lab/overlays`** page (`renderLabOverlays` + behaviours in
  `lab.js` + component CSS): anchored popover (outside-click/Esc), an
  auto-dismissing notification stack, a cookie-consent banner, a slide-in drawer,
  stacked modals, and a reorderable z-index stack with `elementFromPoint`
  hit-testing - deliberately mirroring the stacking bugs above. New code:
  `lab-overlays.page.ts`, the `labOverlaysPage` fixture, a `lab-ui.spec.ts`
  "Popups and layers" describe block (7 tests) and a new `lab.a11y` path.
  Regenerated README screenshots (now 12) and added Clinic + Test Lab +
  Popups-&-layers to the visual tour. Verified: lint + `format:check` clean,
  `tsc --noEmit` clean, affected local suite green (header 15, lab UI + a11y incl.
  overlays across 3 browsers).
- **2026-06-13** - Reworked the in-app navigation into a **two-tier header** and
  added a cross-platform **`npm run stop`**. The old header crammed the cross-app
  switcher, the section links, and the theme toggle into one flat row of
  identical pills, so the only "you are here" cue was a moving highlight that
  reshuffled between sections (worst on the 9-link Test Lab). New `renderAppBar`
  helper renders a global **app bar** (brand + quiet ghost-pill app switcher +
  theme toggle) above a surface-specific **section nav** of underline tabs;
  applied to all five surfaces (Admin, Storefront, Operations, Clinic, Test Lab).
  All `app-nav-*` / `lab-nav` / `clinic-nav` test hooks preserved, so specs are
  unaffected. `npm run stop` (`scripts/stop-app.ts`, dependency-free; netstat/
  taskkill on Windows, lsof/kill elsewhere) frees port 3000 from any terminal.
  Also strengthened the AGENTS.md / copilot-instructions "done" checklist to
  require updating affected Markdown in the same change. Verified: lint +
  `format:check` clean, `tsc --noEmit` clean.
- **2026-06-14** - Made every primary surface **mutually reachable**, added a
  **menus & dropdowns** Test Lab page, and added a whole new **PetHub Clinic**
  business - all additive and deterministic. (1) A shared
  `renderPrimaryNavLinks(current)` helper in `http/render-helpers.ts` renders a
  cross-app switcher (Admin ↔ Storefront ↔ Clinic ↔ Operations ↔ Test Lab) with
  stable `app-nav-<id>` hooks, wired into all five layouts;
  `cross-navigation.spec.ts` proves mutual reachability. (2) `/lab/menus`
  (`renderLabMenus` + behaviours in `lab.js`) covers native/multiple/dependent
  selects, a custom ARIA listbox, and action/context/flyout/hamburger/split
  menus, with `lab-menus.page.ts`, the `labMenusPage` fixture, a `lab-ui.spec.ts`
  describe block and a new `lab.a11y` path. (3) **PetHub Clinic** is a
  vet-appointment vertical with its own **deterministic in-memory store**
  (`apps/pethub-local/clinic/clinic.ts`, seeded at load, reset per server start -
  deliberately **not** touching the lowdb schema so the 233 baseline stays
  green): a four-step booking wizard (progressive-enhancement form +
  `http/static/clinic.js`), confirmation with `CLN-####` references, an
  appointments table, and `/api/clinic/*` JSON API. New code: `clinic/clinic.ts`,
  `routes/{clinic.routes.ts,clinic-api.routes.ts}`, `http/static/clinic.js`,
  `src/models/api/clinic.dto.ts`,
  `src/helpers/api-clients/pethub-local-clinic.client.ts`, four page objects under
  `src/pages/pethub-local/clinic/`, fixtures (`localClinicApiClient` +
  `clinic*Page`), and specs `clinic.api.spec.ts`, `clinic-ui.spec.ts`,
  `clinic.a11y.spec.ts`. Express 5 route params coerced via `String(...)`.
  Verified: lint + `format:check` clean, `tsc --noEmit` clean, **full
  `test:local` 300 passed**.
- **2026-06-14** - Reorganized `docs/` to be **system-first** (mirroring
  `src/pages/<system>/` and `tests/targets/<system>/`): `pethub-local/`
  (`app.md`, `testing.md`, `qa-feature-plan.html`), `sauce-demo/bugs.md`, and
  `swagger-petstore/bugs.md`, with the generated `bugs.pdf` files moved beside
  their sources; `screenshots/` is unchanged. Added `docs/README.md` as a
  documentation index. Updated every cross-reference (README, AGENTS, PROGRESS,
  the `docs:pdf` scripts in `package.json`, known-defect spec comments, and the
  repo-revival workflow) and rebased the moved guides' relative links
  (`../` → `../../`). Root `README.md`, `AGENTS.md`,
  `TEST_AUTOMATION_STANDARDS.md`, and tool-pinned files
  (`.github/copilot-instructions.md`, `.windsurf/workflows/`) stay at their
  required locations. Verified: `prettier --check` clean on all touched files.
- **2026-06-14** - Added a **QA Test Lab** to `pethub-local` to maximise the
  portfolio's testable surface with generic (non-petstore) automation
  challenges. Two parts, both additive and deterministic: (A) a `/lab` **UI
  playground** - forms + client validation, dynamic loading/add-remove/enable,
  native dialogs, a searchable+sortable table, interactive widgets (tabs,
  accordion, modal, tooltip, progress bar, toast, clipboard, key press), an
  iframe, and an open-shadow-root custom element; and (B) `/api/lab`,
  **httpbin-style stateless HTTP utilities** (request reflection, status codes,
  delay, redirects, basic/bearer auth, cookies, base64, ETag caching, gzip,
  JSON/XML/HTML negotiation). New code: `apps/pethub-local/lab/{lab.ts,http-lab.ts}`,
  `routes/{lab.routes.ts,lab-api.routes.ts}`, `http/static/lab.js`,
  `src/models/api/lab.dto.ts`, `src/helpers/api-clients/pethub-local-lab.client.ts`,
  page objects under `src/pages/pethub-local/lab/`, fixtures `localLabApiClient`
  plus `lab*Page`, and specs `pethub-local-lab.api.spec.ts` (27),
  `lab-ui.spec.ts` (19 × 3 browsers), `lab.a11y.spec.ts` (8). Client behaviour
  is wired via `data-test` hooks (no inline handlers) and pages are accessible
  (labels/roles/ARIA) so they double as a11y targets. Verified: lint +
  `format:check` clean, `tsc --noEmit` clean, **full `test:local` 233 passed**.
- **2026-06-13** - Added a v2 **"platform" testing tier** to `pethub-local` so the
  portfolio demonstrates more _types_ of API testing against a deterministic
  backend: observability/contract (`/version`, `/ready`, `/metrics`,
  `/openapi.json`), bearer-token auth + RBAC (`/auth/*`, admin-only delete),
  strict input validation (`422` field errors), pagination/filter/sort/search
  (`GET /api/v2/pets`), idempotent order creation (`Idempotency-Key`), rate
  limiting (`429` + `Retry-After`), an XSS-escaping security sandbox
  (`/v2/echo`), and poll-driven async jobs (`/jobs`). New code:
  `apps/pethub-local/platform.ts` + `routes/qa.routes.ts`,
  `src/models/api/platform.dto.ts`,
  `src/helpers/api-clients/pethub-local-platform.client.ts`, fixture
  `localPlatformApiClient`, and spec `pethub-local-platform.api.spec.ts`
  (28 tests). Everything is additive (v1 contract unchanged) and deterministic
  (signed tokens, per-`X-Client-Id` rate buckets, poll-count job progression).
  Also added `docs/pethub-local/qa-feature-plan.html` (roadmap of explored functionality).
  Verified: lint clean, `tsc --noEmit` clean, local API project 41 passed.
- **2026-06-11 (later)** - LTS/latest upgrade pass: Node pin 22 → 24 (`.nvmrc` + `engines`),
  ESLint 8 → 10 with flat config (`.eslintrc.cjs` → `eslint.config.mjs`, typescript-eslint v8
  meta-package), Express 4 → 5 (no breaking route patterns in the app), Playwright 1.60,
  dotenv 17, marked/prettier/tsx latest. Also migrated `tsconfig.json` off deprecated `baseUrl` +
  `moduleResolution: Node` (TS 6 deprecations) to relative `paths` + NodeNext. Verified: lint
  clean, doctor OK, `test:local` 113 passed.
- **2026-06-11** - Broadened `@smoke`/`@critical` tag coverage from 8 to ~20 tests across all
  three targets (core journeys: checkout, cart, pet/order/user CRUD, DB validation, ops portal
  overview) so `--grep @smoke` / `--grep @critical` CI selection is meaningful. Also fixed stale
  README facts: Node engines `>=20` → `>=22` and screenshot count 10 → 9 (the script captures 9;
  there is no `02-*` image). Verified: lint clean, `npm run test:local` 113 passed.
- **2026-06-04** - Clarified the admin **Swagger-style Explorer** login for humans:
  added a caption noting the Petstore-style login is intentionally stateless (records
  a session but does not gate the dashboard) and an active-session badge
  (`data-test="explorer-session-status"`) so the action has visible feedback. Backed
  by a read-only `getActiveSession` query; no change to the API/test contract.
  Inline result panels were considered but deferred (needs client JS + would touch UI
  test expectations).
- **2026-06-04** - Bumped Node pin 20 → 22 (`.nvmrc`, `engines`, docs) because
  Node 20 reached end-of-life (~April 2026); 22 is Active LTS. CI installs from
  `.nvmrc`, so this moves CI off an EOL runtime.
- **2026-06-04** - Centralized `pethub-local` storefront credentials in
  [src/helpers/test-data.ts](src/helpers/test-data.ts) (`pethubLocalUsers` /
  `pethubLocalPassword`); specs and the screenshot script import them. The app
  ([storefront.ts](apps/pethub-local/storefront/storefront.ts)) keeps its own
  copy as the runtime source of truth. Storefront password changed off the
  Sauce-Demo value, and login error copy rebranded away from `Epic sadface:`.
- **2026-06-03** - Adopted `AGENTS.md` as the single source of truth for AI agents;
  `.github/copilot-instructions.md` is a thin pointer. Deep rules stay in
  `TEST_AUTOMATION_STANDARDS.md`. Windsurf workflows retained as task playbooks.
- **(earlier)** - Split Playwright into two configs: external (parallel,
  informational) and local (serial, `workers: 1`) because lowdb is a single shared
  file and cannot tolerate concurrent writes.

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
