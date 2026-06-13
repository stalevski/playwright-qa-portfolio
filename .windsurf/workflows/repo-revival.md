---
description: bring the repo back to life after a long absence (months or years)
---

# Repo Revival Workflow

Use this workflow when returning to the project after a long break (typically six months or more) and you want to confirm everything still runs before doing any new work. Designed for the case where you may have missed Dependabot PRs, Node has reached end-of-life, or Playwright browser binaries have rotated out of Microsoft's CDN.

Apply the repository standards in `TEST_AUTOMATION_STANDARDS.md`.

## When to use this vs. the README checklist

- **README checklist** (`Returning to this project after a while?`): you've been away for a few months and just need to re-orient.
- **This workflow**: you've been away long enough that runtime versions, dependencies, or external sites may have shifted in ways that require active intervention.

## Goals

- confirm the local stack still runs
- diagnose and resolve runtime rot in the smallest possible diff
- separate "framework still works" from "external sites changed"
- document what was bumped so future revival is even faster

## Recommended process

1. **Snapshot the starting state.** Before changing anything, capture what's broken:
   - run `node --version`, `npm --version`, and compare against `engines.node` in `package.json` and the value in `.nvmrc`
   - run `npm.cmd run doctor` and note any failures
   - check the most recent scheduled CI run in GitHub Actions to see when things last passed

2. **Bring Node back in line.** If `.nvmrc` points at an EOL Node major, update it to the current LTS in a single commit. Do not mix this with other changes.

3. **Reinstall against the existing lockfile first.**
   - run `npm.cmd ci`
   - if that succeeds, the dependency tree is intact and you can move on
   - if it fails with `EUNSUPPORTEDPROTOCOL`, missing tarballs, or peer-dependency conflicts, fall through to step 4

4. **Refresh dependencies only if `npm ci` failed.** Bump in this order, smallest scope first, validating after each:
   - `@playwright/test` to the latest minor compatible with the project's Node version, then `npx playwright install`
   - `eslint` and `@typescript-eslint/*` if step 5 surfaces lint failures from rule changes
   - `typescript` last, since it can ripple through type errors
   - everything else only if it blocks one of the above

5. **Validate the framework before validating external sites.**
   - `npm.cmd run lint`
   - `npm.cmd run format:check`
   - `npm.cmd run test:pethub-local` — this is the canary; it is fully self-contained and proves the framework still works

6. **Validate external suites separately.** Run `npm.cmd run test:external` and triage any failures into two buckets:
   - **framework rot** (selectors stale, Playwright API changed) — fix in the page objects or helpers
   - **target rot** (the public site changed) — update `docs/sauce-demo/bugs.md` or `docs/swagger-petstore/bugs.md` and the matching `known-defects.spec.ts` / API specs

7. **Triage Dependabot PRs.** If many have piled up:
   - prefer rebasing each one against the now-revived main rather than merging all at once
   - merge minor-and-patch grouped PRs first, then majors one at a time
   - re-run `npm.cmd run test:local` after each merge

8. **Refresh screenshots if the storefront UI shifted.** Run `npm.cmd run screenshots` and inspect the diff under `docs/screenshots/`.

## Suggested commands

- baseline diagnostics:
  - `node --version`
  - `npm.cmd run doctor`
- targeted bumps:
  - `npm.cmd install -D @playwright/test@latest && npx playwright install`
  - `npm.cmd install -D eslint@latest @typescript-eslint/eslint-plugin@latest @typescript-eslint/parser@latest`
  - `npm.cmd install -D typescript@latest`
- validation pyramid:
  - `npm.cmd run lint`
  - `npm.cmd run format:check`
  - `npx tsc --noEmit`
  - `npm.cmd run test:pethub-local` (canary)
  - `npm.cmd run test:external` (informational)
- screenshot refresh:
  - `npm.cmd run app:start` in one terminal, then `npm.cmd run screenshots` in another

## Decision rules

- If `npm.cmd run test:pethub-local` passes, the framework is healthy. External failures from there on are about the public sites, not the repo.
- If a Playwright bump changes more than two or three page objects, stop and review the migration guide for that version before continuing.
- Do not silently weaken or skip a test to make revival succeed. If a test no longer reflects reality, update the catalog or the page object explicitly.
- Prefer one focused commit per category of change: Node bump, Playwright bump, lint bump, target-rot fixes, dependabot triage.

## Output expectation

When using this workflow, report:

1. the starting Node, npm, and Playwright versions
2. which step the run got past clean (best case: step 5 with no bumps)
3. every package that was bumped and the version delta
4. any external-target tests that were updated, and the matching catalog entry
5. any Dependabot PRs that were merged or closed
