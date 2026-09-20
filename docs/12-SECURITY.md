# 12 — Security — Vantrilex Agentic Workbench & Launcher

## Purpose

Authentication, authorization, secrets, validation, and update policy.

## Status

New trust boundaries are recorded here before code crosses them.

## Schema

### Boundaries

| Boundary | Validation | Enforced by |
|---|---|---|
| Workspace path input (IPC args) | Absolute-path check, non-empty, traversal rejection | `validate.ts`-style guards in `foundry-ipc.ts` |
| Preload bridge | `contextIsolation`, `sandbox`; promises only, no sync IPC | `src/preload/` configuration |
| Renderer content | CSP lockdown (Step 7); no `eval`, no unsanitized HTML injection | CSP headers + review |
| Voice audio (Step 4) | Size-capped clips, provider TLS only, cache scrubbed of metadata | `src/main/voice/` |
| Keyring (Step 4) | DPAPI `safeStorage`; presence booleans in status queries; never values in logs/IPC/renderer | `src/main/keyring/` |
| Child processes (Step 5) | `runProcess`/`spawnProcess` wrappers; never bare `child_process`; never `shell: true`; `.cmd` shim resolution | `src/shared/child-process/` |
| OTA/mobile relay (Step 6) | Self-hosted relay; QR-paired approval tokens, single-use, expiring | `vendor/happy/` |

### Secrets policy

Zero plaintext secrets: no key values in docs, logs, screenshots,
transcripts, or status payloads. Key names (`FISH_AUDIO_API_KEY`,
`GROQ_API_KEY`) and voice reference IDs are public configuration, not
secrets. Rotation every exactly 10 requests bounds exposure per key.

### Update policy

Electron runtime pinned and ratchet-checked
(`check:runtime-electron-ratchet`). Dependency upgrades land as isolated
commits with a full green suite; a broken upgrade reverts, never lingers.
