---
description: analyze failing Playwright tests and propose safe, minimal fixes
---
# AI Test Healer Workflow

Use this workflow when a Playwright test fails and you want AI to diagnose the failure and propose a reviewable fix.

Apply the repository standards in `TEST_AUTOMATION_STANDARDS.md`.

## Inputs

- Failing test name
- Error message
- Relevant screenshot/video/trace if available
- Current spec and page object/client code

## Required healing behavior

The AI should:

1. Identify the root cause category:
   - locator drift
   - timing issue
   - bad assertion
   - data setup issue
   - third-party site instability
   - framework design issue
2. Explain why the failure happened
3. Propose the smallest safe fix
4. Note if the problem is environmental rather than code-related
5. Avoid broad rewrites unless necessary
6. State whether the issue should be patched locally or refactored at the framework level

## Repo-specific healing rules

- Do not replace explicit Playwright code with agentic runtime steps.
- Keep fixes in the proper layer:
  - spec issue -> spec
  - repeated UI behavior -> page object
  - repeated API behavior -> client
- Preserve readability.
- If the public Swagger site itself is inconsistent, say so explicitly.
- Prefer improving locator strategy and scope before adding retries.
- Prefer test ids for app-owned UI and roles/scoped structure for third-party UI.
- Prefer deterministic test data over looser assertions.
- Preserve the target-based folder structure and screen/component-based page-object layout.

## Output format

Return:

1. Root cause
2. Minimal fix
3. Files to change
4. Risk of regression
5. Whether rerunning is enough to validate

## Example prompt

"Analyze why the Firefox run cannot open the Add Pet Swagger block. Review the current page object and suggest the smallest reliable locator/interaction fix."
