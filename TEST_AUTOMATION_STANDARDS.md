# Test Automation Standards

## Purpose

This document defines the default engineering standards for this repository's automated testing code.

Use these standards when designing or changing:

- test structure
- page objects
- components
- API clients
- locators
- fixtures
- test data patterns
- refactoring decisions

## Primary priorities

Default priorities for this repository are:

1. Readability
2. Maintainability
3. Enterprise patterns
4. Strongest locator stability

When there is a tradeoff, prefer long-term clarity and stability over minimal file count or the fastest short-term patch.

## Architecture standards

### Folder structure

Prefer organizing code by target or system first.

Examples:

- `tests/dev/pethub-local/{ui,api,a11y}` - tests for our own in-repo app
- `tests/qa/<system>/{ui,api}` - tests for external third-party targets
- `src/pages/<system>/`
- `src/pages/<system>/components/`

### Page object design

Prefer:

- one page object per real screen or page
- reusable components for shared UI
- page objects that expose business actions and assertions
- thin tests with clear intent

Avoid:

- monolithic page classes covering the whole app
- large inheritance chains for UI abstractions
- raw selectors inside spec files
- utility-heavy designs that hide intent

### Component design

Create a component when a UI area is reused across screens, such as:

- navigation
- burger menu
- modal
- toast
- table section

Components should encapsulate repeated UI behavior without taking over screen-specific responsibilities.

## Locator strategy

### Preferred order

Use the strongest stable locator available in this order:

1. App-owned test ids
2. Roles with accessible names
3. Labels and placeholders where appropriate
4. Scoped text locators
5. Structural locators only when unavoidable

### App-owned UI

If the team controls the application markup, prefer adding stable test hooks instead of building brittle selectors around unstable DOM.

Preferred patterns:

- `data-test`
- `data-testid`

Choose one repo convention and apply it consistently.

### Third-party UI

For third-party or generated UI, semantic coverage may be limited.

In those cases:

- prefer roles when reliable
- prefer scoped text inside a stable container
- use structural locators when necessary
- do not force locator purity if it reduces stability

### Locator anti-patterns

Avoid when a stronger anchor exists:

- brittle text-only selectors
- long chained CSS selectors tied to presentation
- XPath for ordinary UI cases
- selectors duplicated across tests

## Test design standards

Prefer:

- short, intention-revealing tests
- clear arrange, act, assert flow
- business-focused assertions
- shared setup via fixtures or typed clients when it improves clarity

Avoid:

- low-level DOM interaction in specs when it belongs in a page object
- assertions that only verify implementation detail with no business value
- duplicate setup or helper logic across tests

## API automation standards

Prefer:

- typed API clients over direct raw request calls in specs
- DTOs for transport shapes
- builders or factories for test data creation
- assertions on business-relevant fields

Add client methods when behavior is reused across specs.

## Refactor vs patch guidance

### Patch when

Choose the minimal safe patch when:

- the problem is isolated
- the current abstraction is already good
- the issue does not repeat elsewhere
- a broader refactor would create unnecessary churn

### Refactor when

Choose refactoring when:

- the same weakness appears more than once
- a page object or client is overgrown
- locator strategy is repeatedly weak
- logic belongs in a shared abstraction
- future work will continue in the same area

### General rule

Patch isolated bugs.

Refactor repeated design problems.

## App-owned UI vs third-party UI

### App-owned UI

If the team owns the UI, automation should influence product markup when needed.

Prefer:

- adding stable test ids
- improving accessible names and labels
- making automation a first-class concern

### Third-party UI

If the team does not own the UI, be realistic about constraints.

Prefer:

- stable scoping
- semantic locators where available
- focused structural fallbacks where necessary
- explicit notes about third-party instability when relevant

## Quality bar for done

A change should not be considered done until the following are true:

- the code is readable
- naming is clear and intention-revealing
- locator strategy is acceptable for the target type
- the abstraction is in the correct layer
- no stale duplicate structure was introduced
- affected imports and references were updated
- focused validation was executed for the affected area
- tests or docs were updated when conventions changed

## Validation expectations

After meaningful changes, run focused validation for the affected target or area.

Examples:

- changed Swagger page object -> run Swagger UI/API tests affected by the change
- changed Sauce Demo page objects -> run Sauce Demo UI suite or focused project
- changed shared config or fixtures -> run the impacted target suites

## Practical defaults for this repo

Use these defaults unless a task explicitly says otherwise:

- prefer target-based folders
- prefer screen-based page objects
- prefer components for shared UI
- prefer explicit Playwright code
- prefer app-owned test ids for local or owned applications
- accept scoped structural locators for third-party UI like Swagger when needed
- validate focused suites before considering the work complete
