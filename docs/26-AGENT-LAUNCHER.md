# 26 — Agent Launcher — Vantrilex Agentic Workbench & Launcher

## Purpose

Runner CLI orchestration: how Claude Code, OpenCode, and Codex launch,
run, and terminate inside (Step 5) and alongside the ADE.

## Status

Specified for Step 5. Argv shapes frozen here; panel hosting lands
with the embedded terminal.

## Schema

### Runner registry

| CLI | Invocation | Session model |
|---|---|---|
| Claude Code | `claude --workspace <path> [args]` | One PTY per session; stdio inherited by the panel tab |
| OpenCode | `opencode --workspace <path> [args]` | Same |
| Codex | `codex --workspace <path> [args]` | Same |

### Argv construction

Builders assemble argv from fixed shapes: `[cli, '--workspace',
workspace, ...allowListedFlags]`. Workspace must be absolute and
inside an allowed root. Free-form shell strings are forbidden — flags
come from a literal union per CLI. Unknown flags reject the launch
with `{ code: 'BAD_FLAG' }`.

### Stdio and env

Child stdio attaches to the owning PTY tab; nothing is piped through
the main process except framed terminal events. Environment injection
is additive and explicit (`TERM`, locale, runner config path);
owner secrets are never injected into runner env — runners own their
model credentials.

### Windows terminal wrapper

Launches go through `runProcess`/`spawnProcess` (`src/shared/
child-process/`): `windowsHide` set, `shell: false`, `.cmd`/`.bat`
shims resolved to their real targets so `cmd.exe` never mangles
arguments. ConPTY backs the PTY; resize events propagate via
`terminal:resize`. Termination is graceful-first (SIGINT equivalent,
2s grace) then forced; orphans are reaped via the Windows process
table, never by forking PowerShell.
