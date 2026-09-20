# 06 — API Specification — Vantrilex Agentic Workbench & Launcher

## Purpose

Every endpoint and interface contract in one place.

## Status

Published contracts version with migration notes. Foundry v1 shipped
(Step 3); voice/keyring/runner contracts land in Steps 4–5.

## Schema

### Contracts

**Preload bridge (`window.api.foundry`)** — implemented in
`src/preload/api/foundry-api.ts`, bridged in `foundry-bridge.ts`,
composed for web in `web-foundry-api.ts`:

| Method | Inputs (validated) | Output shape | Errors |
|---|---|---|---|
| `detect(workspace)` | absolute path string, non-empty | `{ projectCase: 1\|2\|3, language, stack, action }` | `{ code: 'BAD_PATH', message }` on invalid input |
| `provision(workspace, projectName)` | absolute path, display name (falls back to last path segment) | `{ created: string[], errors: string[] }` | per-file errors collected, never thrown |

**Toast event bus** (`foundry-toast-bus.ts`):

| Function | Signature | Notes |
|---|---|---|
| `pushFoundryToast` | `(message: string, tone: 'info'\|'success'\|'error', ttlMs?: number) => number` | Returns numeric toast ID |
| `subscribeFoundryToasts` | `(listener: (toasts: readonly FoundryToast[]) => void) => () => void` | Returns unsubscribe; effect-safe |
| `dismissFoundryToast` | `(id: number) => void` | Idempotent |
| `resetFoundryToastBusForTest` | `() => void` | Test-only reset |

**IPC channels (main ⇄ preload):**

| Channel | Direction | Payload | Result |
|---|---|---|---|
| `foundry:detect` | renderer → main | `{ workspace }` | detection manifest |
| `foundry:provision` | renderer → main | `{ workspace, projectName }` | `{ created, errors }` |

**Reserved (Steps 4–5):** `voice:speak`, `voice:listen`, `voice:cancel`,
`keyring:status` (presence booleans only), `keyring:rotate`,
`runner:launch`, `runner:terminate`, `terminal:write`, `terminal:resize`.
Full inventory in `docs/25-ELECTRON-IPC.md`.

### Versioning policy

 additive-only within a step: new channels and optional fields are safe;
renaming or removing a channel requires a decision entry, a deprecation
toast in-app, and a one-release overlap. The web fallback seam
(`web-foundry-api.ts`) tracks the same signatures for browser contexts.
