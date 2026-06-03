# GitHub Copilot instructions

This repository's AI guidance lives in **[AGENTS.md](../AGENTS.md)** — read it
first and follow it. The deep engineering rules are in
**[TEST_AUTOMATION_STANDARDS.md](../TEST_AUTOMATION_STANDARDS.md)**.

Quick context:

- TypeScript + Playwright QA portfolio with three targets: `pethub-local`
  (in-repo Express + lowdb app, the deterministic primary target),
  `swagger-petstore`, and `sauce-demo` (both public/informational).
- Organized system-first: `src/pages/<system>/`, `tests/targets/<system>/{ui,api,a11y}`,
  typed API clients (`extends BaseApiClient`), DTO builders, per-target fixtures.
- Run: `npm run app:start`, `npm test` (external then local), `npm run test:local`
  (serial — lowdb is a single shared file), `npm run lint`, `npm run doctor`.
  Node 20 (`.nvmrc`).
- Before "done": `npm run lint` + `npm run format:check` pass, `tsc --noEmit`
  clean, run the affected target's suite, and update
  [PROGRESS.md](../PROGRESS.md) if status/backlog/tech-debt changed.

For anything not covered here, defer to `AGENTS.md` and the standards document.
