# 25 — Electron IPC — Vantrilex Agentic Workbench & Launcher

## Purpose

Complete IPC inventory: every channel, its validation, and its
security invariants.

## Status

Foundry channels shipped (Step 3). Voice/keyring/runner/terminal
channels are reserved for Steps 4–5 with contracts frozen here.

## Schema

### Inventory (17 channels)

| # | Channel | Direction | Args | Result |
|---|---|---|---|---|
| 1 | `foundry:detect` | renderer → main | `{ workspace }` | `{ projectCase, language, stack, action }` |
| 2 | `foundry:provision` | renderer → main | `{ workspace, projectName }` | `{ created, errors }` |
| 3 | `voice:speak` | renderer → main | `{ text, voiceId }` | `{ clipId, ms }` |
| 4 | `voice:listen` | renderer → main | `{ maxSeconds }` | `{ transcript, ms }` |
| 5 | `voice:cancel` | renderer → main | `{}` | `{ drained }` |
| 6 | `voice:status` | renderer → main | `{}` | `{ ready, cacheSize }` |
| 7 | `keyring:status` | renderer → main | `{}` | presence booleans only |
| 8 | `keyring:rotate` | renderer → main | `{ pool }` | `{ index }` |
| 9 | `runner:launch` | renderer → main | `{ cli, workspace, args }` | `{ sessionId, pid }` |
| 10 | `runner:terminate` | renderer → main | `{ sessionId }` | `{ exited }` |
| 11 | `runner:send` | renderer → main | `{ sessionId, input }` | `{ accepted }` |
| 12 | `terminal:write` | main → renderer | `{ sessionId, chunk }` | event (framed) |
| 13 | `terminal:resize` | renderer → main | `{ sessionId, cols, rows }` | `{ applied }` |
| 14 | `terminal:exit` | main → renderer | `{ sessionId, code }` | event |
| 15 | `toast:push` | main → renderer | `{ message, tone, ttlMs }` | event |
| 16 | `provision:progress` | main → renderer | `{ workspace, phase }` | event |
| 17 | `approval:request` | main → renderer | `{ stepId, question, options }` | event |

### Argument validation (`validate.ts` style)

Every handler validates before acting: paths absolute and inside an
allowed root; enums against literal unions; numbers bounded
(`maxSeconds`, `cols/rows`); strings length-capped. Invalid input
yields `{ code, message }` — never a throw across the boundary, never
a silent default.

### Bidirectional streaming

Audio and terminal output travel as framed events with backpressure:
bounded chunk size, sequence numbers, drop-and-resume on overflow with
a resync event. No unbounded buffers on either side.

### Security invariants

No secret values cross any channel (presence booleans only). Renderer
cannot invoke unlisted channels (allow-listed bridge). Main never
executes renderer-supplied code paths — arguments are data, and shell
spawn always goes through the wrapped runners with fixed argv shapes.
