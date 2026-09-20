# 02 — Product Specification — Vantrilex Agentic Workbench & Launcher

## Purpose

Feature-level specification derived from `docs/01-PRODUCT-REQUIREMENTS.md`.
Each feature traces to at least one REQ ID.

## Status

Implemented for detection, provisioning, and toast UX (Step 3). Voice,
terminal, and controls are specified ahead (Steps 4–6).

## Schema

### Features

| ID | Feature | Parent REQ | Behavior |
|---|---|---|---|
| FEAT-001 | 3-case background detection | REQ-001 | `detectFoundryCase(workspace)` inspects the tree and returns case 1 (greenfield), 2 (partial docs), or 3 (fully provisioned). Runs off the UI thread at repo-open. |
| FEAT-002 | 28-file docs generation | REQ-001 | `scaffoldDocs()` writes the canonical hierarchy (foundation 12, execution 8, governance 8) with `{{PROJECT}}` substitution; existing files are kept, never overwritten. |
| FEAT-003 | Skill + ledger provisioning | REQ-001 | 7 core skills and the 60-entry immune ledger materialize; the ledger summary appends to AI-INSTRUCTIONS exactly once. |
| FEAT-004 | Zero-wizard background worker | REQ-002 | `useFoundryBackgroundProvision` binds to `useActiveRepo()?.path`, runs detached with cancellation, and reports exclusively through the toast bus. |
| FEAT-005 | Toast notification bus | REQ-002 | `pushFoundryToast` / `subscribeFoundryToasts`; `FoundryToasts` renders a `role="status"` region; scanning, success, and error tones with auto-dismiss. |
| FEAT-006 | Voice pipeline (Step 4) | REQ-003 | Fish Audio TTS, Groq Whisper STT, GPT-OSS-120B brain, Ammani-only speech, 2.0s golden budget. See `docs/18-VOICE-PIPELINE.md`. |
| FEAT-007 | Embedded terminal (Step 5) | REQ-001 | Multi-tab xterm.js + ConPTY panel hosting Claude Code, OpenCode, Codex concurrently. |
| FEAT-008 | Discrete controls (Step 6) | REQ-002 | Mic toggle, showcase button, Happy Coder QR modal, voice selector — no layout redesign. |

### Personas

| Persona | Need | Failure mode if unmet |
|---|---|---|
| Owner-operator | Silent provisioning; never answer setup questions twice | Repeated bootstrap conversations per repo |
| Voice supervisor | Sub-2s spoken status in dialect | Falls back to reading terminal output |
| Mobile approver | One-tap remote step approval | Blocked agents stall until desktop return |
| Non-technical stakeholder | Showcase dashboard in plain language | Cannot follow project state |

### Edge cases

- Workspace path with trailing separators or non-ASCII segments resolves to the same project name via `findLast` segment scan.
- Provisioning against a read-only tree reports an error toast and keeps zero partial writes (atomic per-file writes only).
- Rapid repo switching cancels the in-flight run; only the latest workspace completes.
- A second open of an already-provisioned repo yields all-`kept`, zero writes.
