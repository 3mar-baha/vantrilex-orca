# 05 — Data Model — Vantrilex Agentic Workbench & Launcher

## Purpose

Entities, fields, ownership, lifecycle, and retention for fork state.

## Status

Invariants enforced by the layer named per invariant.

## Schema

### Entities

| Entity | Fields | Owner | Lifecycle |
|---|---|---|---|
| Session ledger | `{ id, workspace, case, created[], kept[], errors[], at }`, cap 50 entries | `foundry-checkpoint.ts` (main, app-data dir) | Append on each provision; oldest evicted past 50 |
| Immune ledger | 60 `{ id, category, symptom, solution, cmd? }` entries | `foundry-immune-ledger.json` (bundled read-only) | Static per release; summary derived at provision time |
| Core skills | 7 skill bundles (`skill-creator`, `vantrilex-project-founder`, `vantrilex-project-onboarder`, `vantrilex-project-reverse-engineer`, `vantrilex-stack-selector`, `project-showcase-builder`, `project-stress-tester`) | `foundry-skills.ts` templates | Written once per workspace; kept thereafter |
| Canonical docs | 28 generated markdown files with `FOUNDRY_META` marker | `foundry-docs.ts` modules | Created once; regenerated only when missing |
| Toast events | `{ id, message, tone, ttl }` in-memory | `foundry-toast-bus.ts` | Auto-dismiss; test reset via `resetFoundryToastBusForTest` |
| Voice cache (Step 4) | LRU MP3 clips keyed by text hash + voice ID | `src/main/voice/cache` | Evicted by size/age; never contains secrets |
| Keyring pools (Step 4) | `FISH_AUDIO_API_KEY[n]`, `GROQ_API_KEY[n]` in DPAPI `safeStorage` | `src/main/keyring/` | Rotation every exactly 10 requests |
| Project case manifest | `{ projectCase, language, stack, action }` per workspace | Detection result, ephemeral | Recomputed at each repo-open |

### Integrity

- Ledger writes are atomic (temp file + rename); a crash never leaves a half-written ledger — enforced by `foundry-checkpoint.ts`, tested by scaffold round-trip suites.
- Generated docs are never overwritten: existing files are detected and reported as `kept` — enforced by `scaffoldDocs`, asserted in `foundry-docs.test.ts`.
- Secrets never persist outside DPAPI storage and never appear in any entity above — enforced by code review + security audit (`docs/12-SECURITY.md`).
- The 50-entry session cap bounds disk growth — enforced at append time.
