# 27 — Credentials — Vantrilex Agentic Workbench & Launcher

## Purpose

Key management lifecycle: intake, use, rotation, recovery — with a
zero-leak policy across every surface.

## Status

Specified for Step 4 alongside `docs/20-KEYRING.md` (storage mechanics
live there; lifecycle lives here).

## Schema

### Lifecycle

| Stage | Action | Evidence |
|---|---|---|
| Intake | Owner pastes key into the keyring prompt (or env-seeded first run); encrypted via DPAPI before any write | `keyring:status.configured === true` |
| Verify | Single cheap provider call per added key | Success toast, no value logged |
| Serve | Bearer injection at request time from memory only | Requests succeed; values never touch disk |
| Rotate | Automatic every exactly 10 requests; manual anytime | Ledger entry (index + timestamp) |
| Retire | Wiped from storage on owner action or pool replacement | `status` no longer lists the slot |

### Secure env passthrough

Provider calls receive keys in memory at request construction. Keys
never enter child env (runners own their credentials), never enter
query strings, never enter rendered output. Crash dumps and error
payloads are scrubbed of key-shaped strings before display or logging.

### Keyring recovery on startup

The self-check runs before voice subsystems arm: pools present →
subsystems arm silently; pool missing → subsystem disabled with an
explanatory toast; entry corrupt → quarantine to backup slot and
re-prompt. The app never blocks startup on keyring state.

### Zero-leak policy in status queries

`keyring:status`, health endpoints, workflow logs, screenshots, and
transcripts carry presence booleans and counters only. Any surface
found carrying a value is a P0 incident: revoke, rotate, record in
`docs/09-DECISIONS.md`.
