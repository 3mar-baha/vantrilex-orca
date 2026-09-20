# 04 — Architecture — Vantrilex Agentic Workbench & Launcher

## Purpose

System structure, dependency direction, and constraints for the fork.

## Status

Structural changes require a `docs/09-DECISIONS.md` entry.

## Schema

### Structure

```
┌─ Renderer (React 19) ─────────────────────────────┐
│ App.tsx → useFoundryBackgroundProvision(path)      │
│ FoundryToasts (role=status) ← toast-bus (events)   │
│ Mic toggle / Showcase / QR modal / Voice selector  │ Step 6
│ xterm.js terminal panel (multi-tab)                │ Step 5
└───────────────┬────────────────────────────────────┘
                │ window.api (preload, contextIsolated)
┌─ Preload ─────┴────────────────────────────────────┐
│ foundry-api / foundry-bridge · voice-api · keyring │
└───────────────┬────────────────────────────────────┘
                │ IPC (validated, async)
┌─ Main ────────┴────────────────────────────────────┐
│ foundry/* (detect, docs×4, skills, ledger,         │
│   checkpoint, guard-hook, ipc, fs)                 │
│ voice/* (tts, stt, brain, rag, cache)      │ Step 4│
│ keyring/* (DPAPI safeStorage, rotation)    │ Step 4│
│ runners (argv builders, child spawn)       │ Step 5│
└────────────────────────────────────────────────────┘
```

Dependency direction is strictly downward: renderer → preload → main.
Main never imports renderer code. The web fallback seam
(`src/renderer/src/web/`) mirrors the preload API for browser contexts.

### Background daemons

Foundry provisioning runs as a detached async task owned by the renderer
hook with main-process file writers — never a blocking modal, never a
main-thread loop. Voice (Step 4) adds a timed pipeline (STT → brain →
TTS) with per-hop budgets. The Happy relay (Step 6) is an out-of-process
self-hosted server under `vendor/happy/`.

### IPC boundaries

Every channel is async, argument-validated, and returns structured
results (`{ created, errors }` style). Status queries return presence
booleans for secrets, never values. Streaming (voice audio, terminal
I/O) uses framed events, never unbounded buffers.

### Constraints

Language: TypeScript throughout (`.ts` over `.d.ts`). Runtime: Electron
39 pinned; Node 25 main API. Hosting: Windows x64 primary (ConPTY,
DPAPI, NSIS); macOS/Linux supported via runtime checks. New dependencies
require justification: standard library or installed packages first.
