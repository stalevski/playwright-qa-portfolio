# GitHub Copilot instructions

This repository's AI guidance lives in **[AGENTS.md](../AGENTS.md)** - read it
first and follow it. The deep engineering rules are in
**[TEST_AUTOMATION_STANDARDS.md](../TEST_AUTOMATION_STANDARDS.md)**.

Quick context:

- TypeScript + Playwright QA portfolio with three targets: `pethub-local`
  (in-repo Express + lowdb app, the deterministic primary target),
  `swagger-petstore`, and `sauce-demo` (both public/informational).
- Organized by ownership: `src/pages/<system>/`; tests split into `tests/dev/pethub-local/{ui,api,a11y}` (our in-repo app) and `tests/qa/<system>/{ui,api}` (external targets),
  typed API clients (`extends BaseApiClient`), DTO builders, per-target fixtures.
- Run: `npm run app:start`, `npm test` (external then local), `npm run test:local`
  (serial - lowdb is a single shared file), `npm run lint`, `npm run doctor`.
  Node 22 (`.nvmrc`).
- Before "done": `npm run lint` + `npm run format:check` pass, `tsc --noEmit`
  clean, run the affected target's suite, and **update the affected docs in the
  same change without being asked** - PROGRESS.md, README.md, and
  `docs/<system>/*.md` (plus AGENTS.md / standards when conventions change).
  Stale Markdown means the change isn't done. See AGENTS.md → "Validation before
  declaring done".

For anything not covered here, defer to `AGENTS.md` and the standards document.
