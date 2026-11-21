---
name: test-planner
description: Use when turning a requirement, bug, or endpoint list into a test plan.
---

# Test Planner

Turn a requirement, bug report, endpoint list, or user flow into a concrete
Playwright test plan **before** any code is written. Full method, worked example
and prompt template: [docs/workflows/ai-test-planner.md](../../../docs/workflows/ai-test-planner.md).

## Read first

- [AGENTS.md](../../../AGENTS.md) - repo map, conventions, and the
  "Validation before declaring done" checklist.
- [TEST_AUTOMATION_STANDARDS.md](../../../TEST_AUTOMATION_STANDARDS.md) -
  engineering rules (page objects, clients, locators, test data).

## Inputs

- Feature or bug description, and the target area: UI, API, or both.
- Acceptance criteria.
- Risks, edge cases, known-flaky areas.

## Steps

1. Restate the scope in one sentence, naming the target system
   (`pethub-local` is the deterministic primary target; external targets are
   informational).
2. Inventory what already exists before proposing anything: specs under
   `tests/`, page objects under `src/pages/<system>/`, clients under
   `src/helpers/`, DTOs under `src/models/api/`, builders under `src/builders/`.
3. Group proposed scenarios into happy path, negative path, edge case, and
   regression risk. Drop duplicate coverage of already-tested flows or
   endpoints.
4. List the files to create or update, and the test data, builders, DTOs, or
   schema each scenario needs.
5. Name the locator/API dependency risks per target: app-owned UI prefers
   `data-test` ids, roles with accessible names, then scoped text; third-party
   UI may fall back to scoped structural locators (Petstore's cookie banner is
   a known interference source).
6. State what should **not** be automated, and why.
7. Recommend an architecture move: patch the existing structure, or refactor a
   page/component/client - and justify it against the standards.
8. Say which single command will prove the plan once implemented
   (see Verify).

## Output

Scope summary; scenarios by group; files to create/update; data needs; risks;
non-automated items; architecture and locator recommendation. No code yet.

## Verify

`npm run verify` - the single deterministic gate (`lint` + `format:check` +
`typecheck` + `assertions:check` + `docs:check` + `test:local`). A plan is only
"done" when the change built from it passes this, not when the plan reads well.
