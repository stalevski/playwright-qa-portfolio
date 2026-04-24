---
description: plan Playwright UI and API test coverage before implementation
---
# AI Test Planner Workflow

Use this workflow when you want AI to turn a requirement, bug report, endpoint list, or user flow into a concrete Playwright test plan.

Apply the repository standards in `TEST_AUTOMATION_STANDARDS.md`.

## Inputs

- Feature or bug description
- Target area:
  - UI
  - API
  - UI + API
- Acceptance criteria
- Risks, edge cases, or known flaky areas

## Required planning output

The AI planner should return:

1. Scope summary
2. Proposed scenarios grouped by:
   - happy path
   - negative path
   - edge case
   - regression risk
3. Suggested files to create or update
4. Required test data/builders/DTOs
5. Locator or API dependency risks
6. What should not be automated
7. Recommended architecture approach:
   - patch existing structure
   - refactor page/component/client structure
8. Recommended locator approach by target type:
   - app-owned UI
   - third-party UI

## Project-specific rules

- Prefer explicit Playwright code over natural-language runtime execution.
- Reuse existing page objects, API clients, DTOs, and builders.
- Keep tests intention-revealing and short.
- Prioritize readability, maintainability, enterprise patterns, and strongest locator stability.
- Prefer screen-based page objects and reusable components over monolithic page classes.
- Do not add duplicate coverage if an endpoint or flow is already tested.
- For UI work on Swagger Petstore, note cookie-banner interference as a known risk.
- For API work, prefer typed client methods over raw request calls in specs.
- Prefer stable locator strategy in this order:
  - app-owned test ids
  - roles with accessible names
  - scoped text locators
  - structural locators only when unavoidable

## Expected file targets in this repo

- UI specs:
  - `tests/targets/<system>/ui/*.spec.ts`
- API specs:
  - `tests/targets/<system>/api/*.spec.ts`
- Page objects:
  - `src/pages/<system>/*.ts`
- API clients:
  - `src/helpers/*.ts`
- DTOs:
  - `src/models/api/*.ts`
- Builders:
  - `src/builders/*.ts`

## Example prompt

"Plan test coverage for editing a pet in Swagger UI and verifying the update through the existing Playwright framework. Reuse current POM/client structure, identify new methods needed, and separate happy/negative paths."
