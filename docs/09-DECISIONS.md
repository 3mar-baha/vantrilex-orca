# 09 — Decisions — Vantrilex Agentic Workbench & Launcher

## Purpose

Immutable log of structural choices. Append-only: reversals are new
entries referencing the original.

## Status

Active. Tradeoffs without revisit triggers are deferred debt — none
below lack one.

## Schema

### Entries

| Date | Decision | Reason | Revisit trigger |
|---|---|---|---|
| 2026-09-20 | Fork Orca instead of building a custom UI | Orca ships the ADE, worktrees, and terminal stack; a custom shell would re-implement years of work | If Orca upstream goes unmaintained for 12 months |
| 2026-09-20 | Zero-wizard background provisioning | Setup questions repeated per repo are the core pain; toasts preserve flow | If toast-miss rate exceeds 5% in usage |
| 2026-09-20 | Fish Audio default male voice `5b90451e…`, toggle female `88c0375e…` | Voice quality + latency fit the 2.0s budget; dual IDs cover preference | If provider latency or pricing breaks the budget |
| 2026-09-20 | DPAPI `safeStorage` keyring with 10-request rotation | OS-backed secrecy with bounded blast radius per key | If rotation causes provider throttling |
| 2026-09-20 | Bun-portable acceleration where the toolchain allows | Faster installs/builds without changing outputs | If Bun diverges from Node behavior in this tree |
| 2026-09-20 | Split `foundry-docs.ts` into 4 category modules + barrel | 461-line single file exceeded review and lint budgets; categories match the doc ranges | If a category needs further splitting past 300 lines |
| 2026-09-20 | Track `docs/*.md` canonical suite in git (`!docs/*.md`) | Durable architecture docs must survive worktree churn; local-only default would lose them | If upstream objects to tracked planning docs |
| 2026-09-20 | `type` aliases over `interface`, `findLast` over filter+index | Repo oxlint rules (`anti-slop`, `unicorn/prefer-array-find`) enforce it; fewer lint suppressions | If the rule set changes |
