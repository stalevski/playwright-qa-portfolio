#!/usr/bin/env bash
#
# Assertion-weakening guardrail.
#
# A test suite is only worth its assertions: a change that skips a test, swaps a
# value assertion for a truthiness check, forces an action past actionability, or
# sleeps instead of waiting makes the suite greener without making it truer.
# Lint cannot see that - it is a diff-shaped defect - so this gate reads the diff
# against the merge base and fails on the weakening itself, and on any touched
# spec left without a strict assertion at all.
#
# Usage: bash scripts/check-assertions.sh [base-ref]
#   base-ref defaults to $ASSERTIONS_BASE_REF, then origin/main.
#
# Escapes that are deliberate rather than accidental:
#   - A skipped test that is genuinely not automatable belongs in the plan, not
#     in the diff; if it must ship, put `assertions-allow: <reason>` on the added
#     line so the exception is visible in review.
#   - When the base ref is unresolvable (shallow clone, no remote) the gate
#     reports that it skipped rather than passing silently or failing the build.
#
# Requires bash and git: Git Bash on Windows, stock bash in CI.

set -uo pipefail

if ! REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null); then
  echo "assertions: not a git work tree - skipping."
  exit 0
fi
cd "$REPO_ROOT" || exit 0

BASE_REF=${1:-${ASSERTIONS_BASE_REF:-origin/main}}

if ! git rev-parse --verify --quiet "${BASE_REF}^{commit}" >/dev/null; then
  echo "assertions: base ref '${BASE_REF}' not found - skipping (fetch it to enable the gate)."
  exit 0
fi

if ! MERGE_BASE=$(git merge-base "${BASE_REF}" HEAD 2>/dev/null); then
  echo "assertions: no merge base with '${BASE_REF}' - skipping."
  exit 0
fi

# Added lines only: `-U0` keeps the diff to changed lines, and the hunk header
# carries the new-file line number so a finding can be pointed at.
ADDED=$(git diff --unified=0 --no-color --no-ext-diff "$MERGE_BASE" -- '*.spec.ts' | awk '
  /^\+\+\+ / { file = $2; sub(/^b\//, "", file); next }
  /^--- /    { next }
  /^@@/      { line = (match($0, /\+[0-9]+/)) ? substr($0, RSTART + 1, RLENGTH - 1) + 0 : 0; next }
  /^\+/      { printf "%s\t%s\t%s\n", file, line, substr($0, 2); line++; next }
  /^ /       { line++; next }
')

# A brand-new spec never appears in the diff as a file with content, so read
# untracked specs in full: every line in one is an added line.
UNTRACKED=$(git ls-files --others --exclude-standard -- '*.spec.ts')
for untracked in $UNTRACKED; do
  [ -f "$untracked" ] || continue
  ADDED+=$'\n'
  ADDED+=$(awk -v file="$untracked" '{ printf "%s\t%s\t%s\n", file, FNR, $0 }' "$untracked")
done

# Each rule is "pattern<TAB>why it is a weakening". Kept narrow on purpose: a
# gate with false positives gets switched off.
RULES=$(printf '%s\t%s\n' \
  'test\.skip|test\.fixme|\.skip\(|\.fixme\(' 'a skipped or fixed-up test stops asserting anything' \
  'toBeTruthy\(|toBeDefined\(' 'a truthiness check where a value assertion belongs' \
  'force:[[:space:]]*true' 'a forced action that bypasses Playwright actionability' \
  'waitForTimeout\(' 'a fixed sleep where a web-first assertion or expect.poll belongs')

FINDINGS=""
RULE_HITS=0

while IFS=$'\t' read -r pattern reason; do
  [ -n "${pattern:-}" ] || continue
  # The pattern goes through the environment, not `awk -v`: -v processes escape
  # sequences, which would turn `\.` into `.` and silently widen every rule.
  hits=$(printf '%s\n' "$ADDED" | PAT="$pattern" awk -F'\t' '
    BEGIN { pat = ENVIRON["PAT"] }
    NF >= 3 && $0 !~ /assertions-allow:/ && $3 ~ pat { printf "%s:%s\t%s\n", $1, $2, $3 }
  ')
  [ -n "$hits" ] || continue
  while IFS=$'\t' read -r where text; do
    [ -n "$where" ] || continue
    FINDINGS+="  ${where}  ${reason}"$'\n'"      + $(printf '%s' "$text" | sed 's/^[[:space:]]*//')"$'\n'
    RULE_HITS=$((RULE_HITS + 1))
  done <<< "$hits"
done <<< "$RULES"

# A touched spec must still assert something strict. Truthiness-only specs are
# how a suite rots one commit at a time; the check is per file because per-test
# parsing is guesswork, and per file is enough to catch a whole spec going soft.
STRICT='expect.*\.(not\.)?(toBe|toBeCloseTo|toEqual|toStrictEqual|toContain|toContainEqual|toMatch|toMatchObject|toHaveLength|toHaveCount|toHaveText|toContainText|toHaveURL|toHaveTitle|toHaveValue|toHaveAttribute|toHaveClass|toHaveProperty|toHaveScreenshot|toMatchSnapshot|toBeVisible|toBeHidden|toBeEnabled|toBeDisabled|toBeChecked|toBeAttached|toBeNull|toBeGreaterThan|toBeGreaterThanOrEqual|toBeLessThan|toBeLessThanOrEqual|toPass)\('

TOUCHED=$(printf '%s\n' "$ADDED" | awk -F'\t' 'NF >= 1 && $1 != "" { print $1 }' | sort -u)
WEAK=""
WEAK_HITS=0
TOUCHED_COUNT=0

while IFS= read -r file; do
  [ -n "$file" ] || continue
  [ -f "$file" ] || continue
  TOUCHED_COUNT=$((TOUCHED_COUNT + 1))
  if ! grep -qE "$STRICT" "$file"; then
    WEAK+="  ${file}  no strict assertion left in the file"$'\n'
    WEAK_HITS=$((WEAK_HITS + 1))
  fi
done <<< "$TOUCHED"

if [ $((RULE_HITS + WEAK_HITS)) -gt 0 ]; then
  echo "assertions: FAIL - $((RULE_HITS + WEAK_HITS)) weakening change(s) against ${BASE_REF} (${MERGE_BASE:0:7})."
  echo
  echo "Weakens assertions:"
  printf '%s' "$FINDINGS"
  printf '%s' "$WEAK"
  echo
  echo "Fix the cause instead of the assertion: a locator that drifted, a wait that"
  echo "needs expect.poll, or data that needs a builder. If the exception is"
  echo "intentional, add 'assertions-allow: <reason>' on the line so review sees it."
  exit 1
fi

echo "assertions: OK - ${TOUCHED_COUNT} touched spec(s), no weakening against ${BASE_REF}."
exit 0
