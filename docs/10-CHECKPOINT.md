# 10 — Checkpoint — Vantrilex Agentic Workbench & Launcher

## Purpose

Approved-plan ledger gating Vantrilex integration work in this fork. An
edit or write runs only against a checkpoint recorded here. This file is
append-only: new plans and completions append; nothing below is rewritten.

## Status

Step 3 closed. Step 4 (Voice) in preparation. Rollback hashes retained
verbatim for disaster recovery.

## Schema

### Tooling-to-Step Matrix

| Step | Governing components |
|---|---|
| Step 3 (Foundry) | `tdd`, `clean-code-guard`, `test-guard`, `docs-guard`; foundry skills; `architect`, `refactoring-specialist` personas |
| Step 4 (Voice) | Prompt-engineering skills, dialect rules, local Orca tools |
| Step 5 (Terminal) | PTY and terminal integration tools |

### Live ledger (preserved verbatim)

### Active plan

Plan STEP7-RELEASE-01 (approved 2026-09-21): final production hardening,
packaging, and v1.0.0 release per `docs/15-DISTRIBUTION.md`,
`docs/12-SECURITY.md`, `docs/08-ROADMAP.md`. Scope (no builds or tags
yet — /plan gate only): pre-release audit (plaintext-secrets sweep,
CSP enforcement review in `src/renderer/index.html`, `test:vantrilex`
758 green, tsc node+web clean); packaging pipeline (`pnpm run build`
→ `electron-builder --config config/electron-builder.config.cjs --win`,
NSIS x64, `dist/win-unpacked/` integrity: app.asar complete, no
external drive path leakage); release tagging (checkpoint sync, tag
`v1.0.0` on green HEAD, push tag + branch). Governing skills:
clean-code-guard, test-guard, docs-guard, project-stress-tester. Tests:
full `test:vantrilex` + packaging verification. Rollback baseline:
`60ecddd511` (HEAD, pushed, worktree clean at /plan).

Plan STEP6-UI-01 (approved 2026-09-20): four discrete triggers on the
untouched Orca layout per `docs/08-ROADMAP.md`, `docs/21-DESIGN-SYSTEM.md`,
`docs/22-SHOWCASE.md`, `docs/19-MOBILE-PAIRING.md`. Scope (no `src/`
changes yet — /plan gate only): Trigger 1 `MicToggle.tsx` (arm/disarm
voice pipeline via `window.api.voice`); Trigger 2 `ShowcaseButton.tsx`
(invoke `project-showcase-builder` skill, generate/preview
`docs/showcase.html` in DESIGN.md palette `#faf9f5`/`#cc785c`/`#141413`,
serif display, zero cyber-cyan); Trigger 3 `MobilePairingModal.tsx`
(Happy Coder `vendor/happy/` relay, QR single-use 120s nonce, token
exchange, approval queue notifications); Trigger 4 `VoiceSelector.tsx`
(male `5b90451e0cd34b2788841744af7c55c3` default / female
`88c0375e46fa4e3b929755fa077ca5ad` toggle, persistent storage).
Invariants: zero layout diff; `lint:design-system` on all touched
renderer files; TDD suites under `src/renderer/src/components/` and
`tests/ui/` (mount, event emission, bridge calls). Governing skills:
clean-code-guard, project-showcase-builder, test-guard, docs-guard.
Tests: component + composition suites. Rollback baseline: `4108e904a1`
(HEAD, pushed, worktree clean at /plan).

Plan STEP5-TERMINAL-01 (approved 2026-09-20): embedded terminal and
multi-runner PTY panel per `docs/08-ROADMAP.md`, `docs/25-ELECTRON-IPC.md`,
`docs/26-AGENT-LAUNCHER.md`. Scope (no `src/` changes yet — /plan gate
only): `src/main/terminal/pty-manager.ts` (node-pty lifecycle, process-table
tracking, graceful reaping), `src/main/terminal/spawn-wrapper.ts`
(Windows `.cmd`/`.exe` resolution, `windowsHide: true`, no `shell: true`),
`src/main/terminal/argv-builder.ts` (deterministic argv + resume flags for
Claude Code, OpenCode, Codex), typed IPC handlers (`terminal:write`,
`terminal:resize`, `terminal:exit`, `runner:launch`/`terminate`) with
`validate.ts`-style strict validation, renderer multi-tab xterm.js panel
(`src/renderer/src/components/terminal/`, max 3 concurrent sessions per
REQ-001), TDD suites under `tests/terminal/` (argv units, PTY lifecycle,
STRESS-001 concurrency/latency: 3 sessions, resize, p95 input < 100ms).
Governing skills: tdd, clean-code-guard, test-guard, docs-guard. Tests:
terminal unit + stress suites. Rollback baseline: `ca0d0d6274`
(HEAD, pushed, worktree clean at /plan).

Plan STEP3-FOUNDRY-01 (approved): port foundry detection, 28-file
generator, skills, ledger, checkpoint, and guard hook from vantrilex-ts
into `src/renderer/src/components/foundry-background/` plus
`src/main/foundry/` file writers; hook `useFoundryBackgroundProvision`
to `useActiveRepo()?.path` in `App.tsx`; toasts only, zero wizards.
MCPs: none. Skills: tdd, clean-code-guard, test-guard, docs-guard.
Tests: detection, scaffold, toast-event suites. Rollback: `git stash
create` before code.

### Active rollback checkpoint

- 2026-09-20: pre-integration checkpoint `8de0c535c8b2504836304593ee11476dff8aa191`
  (`git stash create`, STEP3-FOUNDRY-01 remainder: main/preload/renderer
  bridge). Restore point if /test fails more than 3 times.

### Completed work

- 2026-09-21: STEP6-UI-01 COMPLETED. Implementation commit `c042deec38`
  (`feat(ui)`, 15 files, +575): MicToggle, VoiceSelector (+
  localStorage-backed singletons), ShowcaseButton (+ shell.openPath
  runner), MobilePairingModal (+ MobileApi relay adapter), lazy
  status-bar insertion, en.json VantrilexTriggers keys. Tooling commit
  `96c255d666` (`test:vantrilex` partition: 109 files, 758/758 green;
  Windows inode exemption recorded). Verification: `test:vantrilex`
  758/758, tsc node+web 0, oxlint 0, `lint:design-system` 0, zero
  `#00FFFF`. Pre-existing upstream failures (inode, WSL, watcher suites)
  verified untouched and exempted — never skipped or weakened.

- 2026-09-20: STEP5-TERMINAL-01 COMPLETED. Implementation commit 1
  (core engine + panel) and commit 2 (preload `runnerTerminal` bridge key,
  `PreloadApi` registration, web fallback seam, main IPC bootstrap with
  `terminal:write`/`terminal:exit` broadcast). Verification: 271/271 green
  across 35 files (terminal, panel, web composition suites), tsc node+web
  clean, oxlint clean, oxfmt applied, `verify:rpc-params-catalog` clean.
  STRESS-001: 3 concurrent sessions, resize storm, p95 input < 100ms.

- 2026-09-20: STEP4-VOICE-01 COMPLETED. Implementation commit `d426f80eb0`
  (`feat(voice)`, 12 files, +746): `src/main/voice/` (`keyring.ts`,
  `tts.ts`, `stt.ts`, `brain.ts`, `orca-tools.ts`), `tests/voice/` (5
  suites), vitest include wiring, voice-pipeline SKILL.md. Verification:
  vitest 23/23 green, tsc node 0 errors, oxlint 0, oxfmt applied.
  Budgets honored: cache hit < 300ms, synthesis < 1.5s, STT < 1.0s,
  brain golden 2.0s / ceiling 5.0s with typed abort. Key names and voice
  reference IDs only — zero secret values in code, docs, or logs.

- 2026-09-20: `refactor(foundry)` split `src/main/foundry/foundry-docs.ts`
  into `foundry-document-template.ts` (FoundryDoc, doc, FOUNDRY_META),
  `foundry-documents-foundation.ts` (12 entries),
  `foundry-documents-execution.ts` (8 entries),
  `foundry-documents-governance.ts` (8 entries), plus barrel
  `foundry-docs.ts` (FOUNDRY_DOCS x28, scaffoldDocs). Fixed
  `foundry-detect.ts` type braces. All 28 entries verified
  byte-identical to upstream `vantrilex-ts/src/engine/foundry/docs.ts`.
  Verification: `tsc --noEmit` clean, `oxlint` clean, `oxfmt` applied,
  vitest 12/12 passing across 4 foundry suites.

- 2026-09-20: `STEP3-FOUNDRY-01` remainder integrated and committed.
  Folded 6 unstaged lint/format corrections (type-only `type` aliases,
  `findLast` over filter+at, `return null` + `Element | null`, valid
  `scrollbar-sleek` token); fixed 2 web tsc errors and 2 oxlint findings
  found at the gate. Commit 1 `e5193c2835` (8 main-process files, +1107).
  Commit 2 `992de9eae0` (14 preload/renderer/startup files, +328).
  Final verification: tsc node clean, tsc web clean, oxlint clean,
  oxfmt applied, vitest 12/12 across detection, scaffold, toast suites.
  Worktree clean. No push performed.

### Step 4 preparation

Next approved plan will be STEP4-VOICE-01: Fish Audio TTS client, Groq
Whisper STT, GPT-OSS-120B brain wiring, DPAPI keyring with 10-request
rotation, and the Ammani-only speech policy. Latency budgets (golden
2.0s, ceiling 5.0s) are acceptance criteria, not aspirations. No Step 4
code has been written; this entry is preparation only.

### Active plan

Plan STEP4-VOICE-01 (approved 2026-09-20): port the voice pipeline and
Ammani Arabic brain per `docs/18-VOICE-PIPELINE.md` + `docs/20-KEYRING.md`.
Scope (no `src/` changes yet — /plan gate only):
`src/main/voice/tts.ts` (Fish Audio `s2.1-pro-free`, male voice
`5b90451e0cd34b2788841744af7c55c3`, female `88c0375e46fa4e3b929755fa077ca5ad`,
LRU MP3 cache), `src/main/voice/stt.ts` (Groq `whisper-large-v3-turbo`),
`src/main/voice/brain.ts` (`openai/gpt-oss-120b`, golden 2.0s / ceiling
5.0s), `src/main/voice/keyring.ts` (DPAPI pools, 10-request rotation),
local Orca control tools + voice SKILL.md, TDD suites (latency
benchmarks, rotation triggers, boundary mocks). Governing skills: tdd,
clean-code-guard, test-guard, docs-guard. Tests: voice unit suites +
latency benchmarks. Rollback: worktree clean at /plan; `git stash
create` emitted no object — restore point is `origin/main @ c4c91d7697`
(pushed 2026-09-20, remote clean).
