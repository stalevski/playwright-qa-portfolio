# Project Progress & Working Notes

> Shared status file so this project can be picked up on any machine, by the
> author or a collaborator, without re-discovering context. Keep it short and
> current. For deep engineering rules see
> [TEST_AUTOMATION_STANDARDS.md](TEST_AUTOMATION_STANDARDS.md); for an overview
> see [README.md](README.md).

_Last updated: 2026-06-14_

---

## 1. Snapshot — what works today

- **Three test targets** are wired and runnable:
  - `swagger-petstore` — public API + UI (informational, can be flaky).
  - `sauce-demo` — public UI with `storageState` auth reuse (informational).
  - `pethub-local` — in-repo **Express + lowdb** app (deterministic, the
    primary target). UI + API + a11y.
- **~320–335 tests across ~28 spec files.**
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
| `swagger-petstore` | ✅  | ✅  |  —   | Public API asserts some buggy status codes (see `docs/swagger-petstore/bugs.md`). |

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

- **2026-06-14** — Fixed three reported header/menu bugs (each with a regression
  test) and added a **Popups & layers** Test Lab page. (1) **Toolbar shift /
  overlap**: the theme-toggle label ("Dark mode" ↔ "Light mode") changed width
  and reflowed the flex-end app-bar cluster, and the non-wrapping `.app-bar`
  collided with the tools at tight widths. Fixed in `theme.css` (`.app-bar`
  flex-wrap, `.brand { min-width: 0; flex: 1 1 16rem }`, toggle-label
  `min-width: 6em`) and locked in by a geometric guard
  [header-layout.spec.ts](tests/targets/pethub-local/ui/header-layout.spec.ts)
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
  hit-testing — deliberately mirroring the stacking bugs above. New code:
  `lab-overlays.page.ts`, the `labOverlaysPage` fixture, a `lab-ui.spec.ts`
  "Popups and layers" describe block (7 tests) and a new `lab.a11y` path.
  Regenerated README screenshots (now 12) and added Clinic + Test Lab +
  Popups-&-layers to the visual tour. Verified: lint + `format:check` clean,
  `tsc --noEmit` clean, affected local suite green (header 15, lab UI + a11y incl.
  overlays across 3 browsers).
- **2026-06-13** — Reworked the in-app navigation into a **two-tier header** and
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
- **2026-06-14** — Made every primary surface **mutually reachable**, added a
  **menus & dropdowns** Test Lab page, and added a whole new **PetHub Clinic**
  business — all additive and deterministic. (1) A shared
  `renderPrimaryNavLinks(current)` helper in `http/render-helpers.ts` renders a
  cross-app switcher (Admin ↔ Storefront ↔ Clinic ↔ Operations ↔ Test Lab) with
  stable `app-nav-<id>` hooks, wired into all five layouts;
  `cross-navigation.spec.ts` proves mutual reachability. (2) `/lab/menus`
  (`renderLabMenus` + behaviours in `lab.js`) covers native/multiple/dependent
  selects, a custom ARIA listbox, and action/context/flyout/hamburger/split
  menus, with `lab-menus.page.ts`, the `labMenusPage` fixture, a `lab-ui.spec.ts`
  describe block and a new `lab.a11y` path. (3) **PetHub Clinic** is a
  vet-appointment vertical with its own **deterministic in-memory store**
  (`apps/pethub-local/clinic/clinic.ts`, seeded at load, reset per server start —
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
- **2026-06-14** — Reorganized `docs/` to be **system-first** (mirroring
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
- **2026-06-14** — Added a **QA Test Lab** to `pethub-local` to maximise the
  portfolio's testable surface with generic (non-petstore) automation
  challenges. Two parts, both additive and deterministic: (A) a `/lab` **UI
  playground** — forms + client validation, dynamic loading/add-remove/enable,
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
- **2026-06-13** — Added a v2 **"platform" testing tier** to `pethub-local` so the
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
