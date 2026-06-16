---
description: clean up repo formatting in small, reviewable batches
---

# Formatting Cleanup Workflow

Use this workflow when the repository has widespread Prettier drift and you want to improve formatting without mixing it into unrelated feature or bug-fix changes.

Apply the repository standards in `TEST_AUTOMATION_STANDARDS.md`.

## Goals

- keep formatting-only changes separate from functional changes
- avoid massive, noisy diffs unless explicitly requested
- preserve reviewability by batching files logically

## Recommended process

1. Check the current baseline:
   - run `npm run format:check`
   - note the number and categories of affected files

2. Split cleanup into small batches, for example:
   - config and root files
   - `src/core` and `src/fixtures`
   - one page-object area at a time
   - one test target at a time
   - local app files separately from test framework files

3. For each batch:
   - run Prettier only on that batch
   - review the diff for accidental semantic changes
   - run the smallest relevant validation command for that batch

4. Prefer pairing each batch with targeted validation:
   - page object batch -> relevant UI suite
   - API client batch -> relevant API suite
   - config batch -> lint and a smoke test command

5. Do not combine broad formatting with functional edits unless the user explicitly asks for both in one change.

## Suggested commands

- baseline check:
  - `npm run format:check`
- targeted formatting example:
  - `npx prettier --write src/pages/sauce-demo/**/*.ts tests/external/sauce-demo/**/*.ts`
- validation examples:
  - `npm run lint`
  - `npx playwright test --project=sauce-demo-ui-chromium`
  - `npx playwright test tests/external/swagger-petstore/ui/petstore-ui.spec.ts --project=swagger-petstore-ui-chromium`

## Decision rules

- If more than roughly 20-30 files would change, prefer multiple PRs/commits.
- If a file already has functional modifications in flight, avoid adding formatting-only churn unless required.
- If Prettier reveals a readability or syntax issue, stop and review before continuing.

## Output expectation

When using this workflow, report:

1. the chosen batch
2. the files changed
3. the validation run
4. any remaining formatting backlog
