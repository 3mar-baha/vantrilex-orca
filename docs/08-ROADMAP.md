# 08 — Roadmap — Vantrilex Agentic Workbench & Launcher

## Purpose

Sequenced milestones from now to launch and beyond.

## Status

Milestones move only with a `docs/09-DECISIONS.md` entry. The top item is
always the next increment.

## Schema

### Milestones

| Date | Milestone | Shippable outcome | Satisfies |
|---|---|---|---|
| 2026-09-20 | Steps 1–2.5 done | Fork boots with splash + armed tooling | REQ-002 |
| 2026-09-20 | Step 3 done | Silent foundry live (commits `6ded2fc8`, `e5193c28`, `992de9ea`) | REQ-001, REQ-002 |
| Next | Step 4: Voice pipeline | Ammani voice control inside latency budgets | REQ-003 |
| After | Step 5: Embedded terminal | 3 concurrent runner sessions in-panel | REQ-001 |
| After | Step 6: Discrete controls | Mic/showcase/QR/voice triggers, zero layout diff | REQ-002 |
| After | Step 7: Release | NSIS installer + v1.0.0 tag | REQ-004, REQ-005 |
| v2.0 | Sovereign DeepSeek harness | Native DeepSeek runner integration | Future REQ set |

### Verification gates per milestone

Every milestone closes with: `tsc --noEmit` (node + web), `oxlint`
(+ design-system on renderer touches), `oxfmt`, targeted Vitest suites,
an atomic Conventional Commit, and a checkpoint entry. Release adds the
full suite, secrets audit, CSP review, and the packaging run.
