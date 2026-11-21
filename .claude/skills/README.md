# Skills - Claude Code

The skill definitions live in [`.agents/skills`](../../.agents/skills), one
directory per skill with a `SKILL.md` in the cross-vendor format (YAML
frontmatter plus steps). That directory is the single source of truth; nothing
here duplicates it.

- [test-planner](../../.agents/skills/test-planner/SKILL.md)
- [test-generator](../../.agents/skills/test-generator/SKILL.md)
- [test-healer](../../.agents/skills/test-healer/SKILL.md)
- [coverage-assistant](../../.agents/skills/coverage-assistant/SKILL.md)

## Why a pointer instead of a symlink

The intended layout is `.claude/skills -> ../.agents/skills`, but a committed
symlink is not portable. Windows refuses `os.symlink` without Developer Mode or
an elevated shell (`WinError 1314`), and a clone made with `core.symlinks=false`
materialises the link as a plain text file containing the target path - a broken
skill either way. A copied tree would drift from `.agents/skills` on the first
edit, so the pointer is deliberate.

To have Claude Code load these skills, point it at `.agents/skills` directly, or
create the link locally where the OS allows it.

The human-readable detail behind each skill stays in
[`docs/workflows`](../../docs/workflows); each skill links to its playbook.
