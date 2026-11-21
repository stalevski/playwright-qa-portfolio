---
name: test-healer
description: Use when a Playwright test fails and you need the smallest safe fix.
---

# Test Healer

Diagnose a failing Playwright test and land a reviewable, minimal fix. Full
method and prompt template:
[docs/workflows/ai-test-healer.md](../../../docs/workflows/ai-test-healer.md).

## Read first

- [AGENTS.md](../../../AGENTS.md) - conventions and the "Validation before
  declaring done" checklist.
- The failure itself: the error message, `test-results*/` artefacts, and the
  HTML report from `test-results-local/results.json` when parsing beats
  scraping.

## Steps

1. Classify the root cause before touching code: locator drift, timing issue,
   bad assertion, data/setup issue, third-party instability, or framework
   design flaw. Say which, and why.
2. Reproduce it deliberately. `npm run test:failed:local` re-runs only the
   previous failures, so the loop stays short.
3. Fix at the layer that owns the problem: spec bug -> spec, repeated UI
   behaviour -> page object, repeated API behaviour -> client, wrong shape ->
   DTO/builder. Do not move a fix upward to hide a layer bug.
4. Improve the locator strategy and its scope before reaching for retries; add
   a `data-test` id to the in-repo app when the semantic hook is missing.
   Third-party targets may need scoped structural locators - say so if the
   public site itself is inconsistent.
5. Keep the assertion strength: a smaller, stricter assertion beats a looser
   one that passes. Never delete an assertion to make a run green, and never
   convert a value assertion into `toBeTruthy()`.
6. Note when the cause is environmental (stale instance on port 3000, shared
   `PETHUB_DATA_DIR`, missing browser) rather than code, and fix the cause.
7. A `globalSetup` failure is fatal: the database was not reset, so every later
   assertion runs against unknown state. Do not work around it.

## Output

Root cause; minimal fix; files changed; regression risk; whether a re-run alone
validates it.

## Verify

`npm run verify` - the single deterministic gate (`lint` + `format:check` +
`typecheck` + `assertions:check` + `docs:check` + `test:local`). The healer is
only finished when the whole gate is green, not when the one failing test is.
