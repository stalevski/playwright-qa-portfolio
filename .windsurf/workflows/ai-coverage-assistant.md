---
description: compare current Playwright coverage against Swagger Petstore features and identify gaps
---

# AI Coverage Assistant Workflow

Use this workflow to compare the existing framework against requested coverage and identify missing tests.

Apply the repository standards in `TEST_AUTOMATION_STANDARDS.md`.

## Coverage review process

1. Inventory existing specs
2. Inventory existing page object/client methods
3. Map current coverage to feature or endpoint list
4. List uncovered or weakly covered areas
5. Recommend the smallest useful additions

## For this repository

Primary coverage buckets are:

- Swagger Petstore
  - UI
    - landing page
    - visible operations
    - authorization modal
    - pet creation and lookup from UI
  - API
    - pet endpoints
    - store endpoints
    - user endpoints
- Sauce Demo
  - UI
    - login
    - sorting
    - cart
    - checkout
    - menu/session flows
- PetHub Local
  - UI
    - dashboard
    - pet creation
    - audit and relation visibility
  - API
    - health
    - pets
    - users
    - orders
    - audit log

## What the assistant should detect

- duplicate tests
- endpoints with no assertions on returned data
- missing negative cases
- helper methods that should be extracted
- specs that should be split or consolidated
- overgrown page objects or clients
- places where page objects should be split by screen or component
- weak locator strategy where test ids or stronger semantic locators should be preferred

## Output format

Return:

1. Covered areas
2. Missing areas
3. Weak areas
4. Suggested next tests
5. Suggested refactors, if any

## Example prompt

"Review the current Petstore Playwright framework and list what negative-path API coverage is still missing after the full endpoint suite was added."
