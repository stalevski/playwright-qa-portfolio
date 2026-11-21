---
name: coverage-assistant
description: Use when comparing existing Playwright coverage against required scope.
---

# Coverage Assistant

Compare the framework against the coverage it is supposed to have, and propose
the smallest useful additions. Full method and prompt template:
[docs/workflows/ai-coverage-assistant.md](../../../docs/workflows/ai-coverage-assistant.md).

## Read first

- [AGENTS.md](../../../AGENTS.md) - architecture map and conventions.
- [TEST_AUTOMATION_STANDARDS.md](../../../TEST_AUTOMATION_STANDARDS.md).

## Steps

1. Inventory the specs: `find tests -name '*.spec.ts'`, and
   `npx playwright test --list` for the project/tag view (add
   `--config playwright.local.config.ts` for the in-repo app).
2. Inventory the reusable surface: page-object methods in `src/pages/<system>/`
   and client methods in `src/helpers/api-clients/`. An unused method is a
   coverage gap waiting for its spec.
3. Map current coverage to the requirement or endpoint list, per target:
   `pethub-local` (UI dashboard/pets/audit, API health/pets/users/orders/audit),
   Swagger Petstore (UI operations + auth modal, API pet/store/user), Sauce Demo
   (login, sorting, cart, checkout, menu/session).
4. Flag weak coverage, not just missing coverage: endpoints asserted only on
   status codes, happy-path-only flows, duplicate specs, overgrown page objects
   or clients that should be split by screen/component, and weak locators where
   a `data-test` id or role would hold.
5. Rank the gaps by risk x cost, and stop at the smallest set that closes the
   top of the list.

## Output

Covered areas; missing areas; weak areas; the suggested next tests in priority
order; refactors only where they pay for themselves.

## Verify

`npm run verify` - the single deterministic gate (`lint` + `format:check` +
`typecheck` + `assertions:check` + `docs:check` + `test:local`). Any tests added
from the gap list land through this gate before the coverage claim is made.
