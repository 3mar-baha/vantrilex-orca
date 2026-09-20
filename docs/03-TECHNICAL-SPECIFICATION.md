# 03 — Technical Specification — Vantrilex Agentic Workbench & Launcher

## Purpose

Implementation-facing specification: components, flows, and contracts at a
finer granularity than `docs/04-ARCHITECTURE.md`.

## Status

Mirrors the shipped Step 3 tree and the specified Steps 4–7 targets.

## Schema

### Stack

| Layer | Choice | Evidence |
|---|---|---|
| Shell | Electron 39 (runtime pinned by `check:runtime-electron-ratchet`) | `package.json`, `config/scripts/ensure-native-runtime.mjs` |
| Package manager | pnpm 12 with workspace lockfile | `pnpm-workspace.yaml`, `pnpm-lock.yaml` |
| Renderer | React 19, Vite 7 (rolldown-vite), TailwindCSS, shadcn primitives | `src/renderer/` |
| Main process | Node 25 API surface, `electron-vite` build plugins | `src/main/`, `config/` |
| Terminal | node-pty with ConPTY on Windows, xterm.js frontend | Orca terminal stack |
| Tests | Vitest 4, happy-dom + Testing Library for renderer suites | `config/vitest.config.ts` |
| Lint/format | oxlint (base + design-system + react-doctor), oxfmt | `config/oxlint*.json`, lint-staged |
| Typecheck | Project references: `tsconfig.node.json`, `tsconfig.web.json`, `tsconfig.relay.json` | `config/` |
| Voice (Step 4) | Fish Audio `s2.1-pro-free` (TTS), Groq Whisper `whisper-large-v3-turbo` (STT), `openai/gpt-oss-120b` (brain) | `docs/18-VOICE-PIPELINE.md` |
| Packaging (Step 7) | electron-builder NSIS x64 | `docs/15-DISTRIBUTION.md` |

### Components

One component per section: responsibility, inputs, outputs, boundary contract.

- **foundry-detect** (`src/main/foundry/foundry-detect.ts`): responsibility —
  classify a workspace into 3 cases. Input: absolute workspace path.
  Output: `{ projectCase, language, stack, action }`. Contract: pure,
  synchronous, no I/O beyond manifest stats.
- **foundry-docs** (`src/main/foundry/foundry-docs.ts` + 4 modules):
  responsibility — generate/refresh the 28-file hierarchy. Input:
  workspace, project name, optional immune summary. Output:
  `{ created, kept }`. Contract: never overwrites; temp-file + rename
  per write; `{{PROJECT}}` substitution.
- **foundry-skills** (`src/main/foundry/foundry-skills.ts`): responsibility
  — materialize the 7 core skills. Contract: idempotent, skipped files
  reported as kept.
- **foundry-immune-ledger** (`.ts` + `.json`, 60 entries): responsibility —
  failure-mode memory. Contract: read-only at runtime; summary appended
  once to AI-INSTRUCTIONS.
- **foundry-ipc** + bootstrap: responsibility — expose `foundry:detect`
  and `foundry:provision` channels. Contract: validated args
  (`validate.ts` style), structured `{ created, errors }` results.
- **preload bridge** (`src/preload/api/foundry-*.ts`): responsibility —
  type-safe `window.api.foundry` surface. Contract: promises only, no
  sync IPC, no secret leakage in results.
- **background worker** (`use-foundry-background-provision.ts`):
  responsibility — run provisioning off the critical path. Contract:
  cancellation flag, error-to-toast mapping, zero thrown rejections.
- **toast bus/UI** (`foundry-toast-bus.ts`, `FoundryToasts.tsx`):
  responsibility — event fan-out and rendering. Contract: subscriber set,
  numeric IDs, auto-dismiss timers owned by the bus.

### Flows

Repo-open → `useActiveRepo()?.path` → worker `detect` → (case 1/2)
`provision` → per-file atomic writes → toast success/error. Repo-open →
(case 3) all-kept → silent no-op. Mic toggle (Step 4) → STT → brain →
TTS → speaker, every hop timed against the 2.0s golden budget.
