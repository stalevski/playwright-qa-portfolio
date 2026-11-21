---
name: test-generator
description: Use when writing Playwright specs and framework code from an approved plan.
---

# Test Generator

Write production-quality Playwright code that matches this repository's
conventions. Use it after a plan exists (see the `test-planner` skill). Full
method and prompt template:
[docs/workflows/ai-test-generator.md](../../../docs/workflows/ai-test-generator.md).

## Read first

- [AGENTS.md](../../../AGENTS.md) - repo map and conventions.
- [TEST_AUTOMATION_STANDARDS.md](../../../TEST_AUTOMATION_STANDARDS.md) - the
  rules the generated code is reviewed against.

## Steps

1. Pick the layer before writing: UI spec, API spec, page object/component,
   typed client, DTO, builder. Extend the existing abstraction instead of
   creating a parallel structure.
2. Place files where the repo expects them:
   - specs - `tests/local/pethub-local/{ui,api,a11y}/*.spec.ts` or
     `tests/external/<system>/{ui,api}/*.spec.ts`
   - page objects - `src/pages/<system>/` (shared components in
     `src/pages/<system>/components/`)
   - clients - `src/helpers/api-clients/` extending `BaseApiClient`
   - DTOs - `src/models/api/`; builders - `src/builders/`
3. UI: locate through `readonly` locators set in the page-object constructor,
   strongest anchor first (`data-test`, role + accessible name, label, scoped
   text). Expose `goto()`/`assertLoaded()` and intention-revealing actions; no
   raw selectors in specs.
4. API: call typed client methods, never `request` directly in a spec. Pass the
   endpoint's schema from `src/schemas/` so `BaseApiClient` validates the
   payload before the spec sees it; keep `*Raw` access for error states.
5. Assert business outcomes with value assertions, not truthiness. Follow AAA
   and keep the body focused on intent.
6. Wait with `waitForURL`, `expect.poll`, or web-first assertions - never
   `waitForTimeout`, and never force an action that fails actionability.
7. Tag: `@smoke`/`@critical` where the suite convention applies, and
   `@known-defect` plus a `docs/<system>/bugs.md` entry for behaviour that is
   asserted _because_ it is currently broken.

## Output

Only what the change needs: specs, the page-object/client methods they call,
and DTO or builder updates when a new shape is genuinely required. No
placeholder code, no unused helpers, no duplicated coverage.

## Verify

`npm run verify` - the single deterministic gate (`lint` + `format:check` +
`typecheck` + `assertions:check` + `docs:check` + `test:local`). A green lint is
not evidence that generated tests work: the local suite must actually run.
