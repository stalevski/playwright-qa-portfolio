---
description: generate Playwright tests and supporting framework code using repo conventions
---
# AI Test Generator Workflow

Use this workflow after planning has been approved.

Apply the repository standards in `TEST_AUTOMATION_STANDARDS.md`.

## Goal

Generate production-quality Playwright code that matches this repository's conventions.

## Generation rules

- Generate explicit Playwright code, not natural-language runtime steps.
- Keep specs readable and business-focused.
- Move reusable UI behavior into page objects.
- Move reusable API behavior into typed clients.
- Use DTOs for transport shapes.
- Use builders/test-data factories for object creation.
- Extend existing abstractions before creating new parallel structures.
- Prefer readability, maintainability, enterprise patterns, and strongest locator stability over minimal file count.
- Prefer target-based folders and screen-based page objects.

## UI generation rules

- Prefer stable locators:
  - app-owned test ids
  - roles when reliable
  - scoped text locators inside a known container
  - structural locators only when unavoidable for third-party UI
- Avoid brittle text-only selectors when a stronger anchor exists.
- Encapsulate repetitive modal/banner/operation behavior in page methods.
- Keep test bodies focused on intent.
- For app-owned UI, add stable test ids when needed rather than relying on brittle selectors.
- For third-party UI like Swagger, accept scoped structural locators when semantic hooks are unavailable.

## API generation rules

- Prefer typed API client methods over direct request usage in specs.
- Add shared helper methods to the API client when multiple specs would need them.
- Use DTOs and builders consistently.
- Assert on business-relevant response fields.

## Output checklist

The generated change should include only what is needed:

1. Updated or new spec files
2. Updated or new page object/client methods
3. DTO changes only if required
4. Builder updates only if required
5. No unnecessary comments or placeholder code

## Example prompt

"Generate an API test for the store order lifecycle using the existing PetStoreApiClient, OrderDto, and OrderBuilder. If helper methods are missing, add them to the client instead of calling request directly in the spec."
