# 14 — Runbook — Vantrilex Agentic Workbench & Launcher

## Purpose

Operational procedures for logs, alerts, incidents, and recovery.

## Status

Every alert links a procedure; alerts without procedures are removed.

## Schema

### Procedures

| Symptom | Diagnosis | Fix | Verify |
|---|---|---|---|
| Windows `.cmd` spawn ENOENT | Shim invoked without resolution; MSYS path rewrite | Route through `runProcess`/`spawnProcess`; never bare `cmd.exe /c` from Git Bash panes | `docs/reference/windows-terminal-shell-selection.md` repro passes |
| EBUSY file lock on build | Stale Electron/daemon handle on output | Kill holder via `windows-process-table` (never fork powershell), rebuild | Clean `electron-vite build` |
| Context saturation in long sessions | Transcript exceeds model window | Strategic compact at phase boundaries; checkpoint doc carries state | Session resumes from `10-CHECKPOINT.md` + journey log |
| Provisioning toast never arrives | Worker cancelled early or bridge missing | Check `useActiveRepo()?.path`, preload exposure, IPC registration in bootstrap | Toast suites green; manual repo-open shows scanning toast |
| Oxfmt churn on commit | Staged files not formatter-canonical | Run `oxfmt --write` on touched files before staging | `oxfmt --check` clean |
| Lint `prefer-array-find` on filter+index | `.filter(..).pop()/.at()` pattern | Use `find`/`findLast` with explicit predicate | `oxlint` clean |
| Test env leak (timers/bus) | Missing `afterEach` reset | `cleanup()`, bus reset, `vi.useRealTimers()` | Suite passes in isolation and full run |

### Incident drills

Drills reference `docs/11-TESTING.md` coverage: kill the provisioner
mid-write and confirm zero partial files; revoke a test key and confirm
presence-boolean status without leakage; break a preload channel and
confirm the web fallback seam holds.
