# 20 — Keyring — Vantrilex Agentic Workbench & Launcher

## Purpose

DPAPI-backed credential management for provider keys with strict
auto-rotation.

## Status

Specified for Step 4. No keyring code written yet. Names below are
configuration; values never appear in docs, logs, or code.

## Schema

### Storage

Electron `safeStorage` (DPAPI on Windows, platform keychain elsewhere)
under `src/main/keyring/`. Two pools: `FISH_AUDIO_API_KEY[n]` and
`GROQ_API_KEY[n]`. Keys enter via an explicit owner action (paste into
the keyring prompt or environment-seeded first run) and are encrypted
before any write. Nothing — not logs, toasts, IPC payloads, or status
queries — ever carries a key value.

### Rotation policy

Strict auto-rotation every exactly 10 requests per pool: a counter
increments on each provider call; on the 10th, the pool advances to the
next key and resets the counter. Rotation events append to the session
ledger (key index + timestamp only). A pool with a single key rotates
onto itself and emits a low-key warning toast advising the owner to add
a spare.

### Status and recovery

`keyring:status` returns presence booleans per pool (`configured:
true/false`, current index, requests-since-rotation) — never values.
On startup, the keyring self-checks: missing pools disable their
subsystems (voice) with an explanatory toast instead of crashing.
Corrupt entries quarantine to a backup slot and re-prompt the owner.

### Lifecycle

Add → verify (single cheap provider call) → serve → rotate → retire.
Retired keys are wiped from storage, not flagged. Owner-initiated
rotation is always available alongside the automatic policy.
