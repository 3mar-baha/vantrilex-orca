# 16 — Workflows — Vantrilex Agentic Workbench & Launcher

## Purpose

Gated workflow for Vantrilex integration work inside this Orca fork.
Native Orca UI stays structurally intact; additions land as isolated
modules with tests. This file merges the canonical discipline with the
live fork gates below — the live sections are authoritative for daily
work.

## Status

Active. `/plan → /code → /test → /sync` gates every step. Atomic
Conventional Commits. Push per phase (pushes require explicit
instruction per session scope).

## Schema

### Tooling-to-Step Matrix

| Step | Governing components |
|---|---|
| Step 3 (Foundry) | `tdd`, `clean-code-guard`, `test-guard`, `docs-guard`; foundry skills (`vantrilex-project-founder`, `vantrilex-project-onboarder`, `vantrilex-project-reverse-engineer`, `vantrilex-stack-selector`); `architect`, `refactoring-specialist` personas |
| Step 4 (Voice) | Prompt-engineering skills, dialect rules, local Orca tools; Fish Audio + Groq clients; keyring rotation |
| Step 5 (Terminal) | PTY and terminal integration tools; xterm panel; worktree-bound sessions |

### Live fork gates (preserved verbatim)

### Gates

`/plan` records a checkpoint in `docs/10-CHECKPOINT.md` before code.
/code implements exactly the plan. /test runs the Orca suite for touched
areas plus new unit tests. /sync commits atomically and pushes.

### Rollback

Before /code: `git stash create` on dirty trees. After more than 3
/test failures: automated rollback prompt before further edits.

### Canonical discipline (expansion)

- **Plan gate:** no code without an approved plan naming target files,
  MCPs/skills, test command, and rollback step. Missing tooling halts
  with a blocker report instead of improvisation.
- **Code gate:** exactly the plan — zero scope expansion. Guard skills
  run on their surfaces before the change leaves the worktree.
- **Test gate:** `tsc` node+web, `oxlint` (+ design-system/react-doctor
  on renderer), `oxfmt --check`, targeted Vitest suites. Red blocks sync.
- **Sync gate:** atomic Conventional Commits (`feat/fix/refactor/docs/
  test/chore` + scope), one logical change per commit, checkpoint entry
  updated with hashes, push per phase when instructed.
- **Circuit breaker:** max 3 fix attempts per hypothesis; each attempt
  changes one variable and predicts its observable outcome; on the 3rd
  consecutive failure, stop, write the incident note, escalate.
