# terminal-orchestrator

Multi-session terminal management, process inspection, and command
dispatching for the Vantrilex ambient agent.

## When to use

Observe runner sessions (Claude Code, OpenCode, Codex) without stealing
OS focus. Detect task conclusions from session exit and output-idle
stabilization. Dispatch engineered prompts into the active runner and
re-arm observation for the next cycle.

## Modules (`src/main/agent/`, `src/main/terminal/`)

- `terminal-watcher.ts` — `TerminalWatcher.observe(event)`: per-session
  bounded transcript ring buffer (32k chars). Concludes on `exit`
  (transcript + code) or on idle stabilization (15s default, `exitCode:
  null, idle: true`). Conclusions are plain data — no window handles.
  `resetSession(id)` starts a fresh attribution cycle; `pendingCount()`
  reports live sessions.
- `terminal-handlers.ts` — `handleRunnerInject(deps, { prompt,
  sessionId? })`: writes prompt + submit newline to the newest alive
  session (or explicit id). Typed `TerminalValidationError` when no
  session is alive — never writes nowhere.
- `pty-manager.ts` — `latestId()`, graceful terminate with force-sweep
  reaping, injected `PtySpawner`/`Scheduler` seams.

## Rules

- Never synthesize completion from phrases or keywords. Triggers are
  exit events and idle stabilization only; interpretation belongs to
  the Ammani brain (`briefing.ts`).
- Never touch window focus, activation, or foreground APIs from
  observation paths. The watcher runs in main and emits data.
- Never dispatch a prompt without an alive session. Surface the typed
  error instead of improvising a target.
- Every observation cycle is bounded: transcript caps, idle windows,
  and scheduler seams keep the watcher O(1) per event.
