# VANTRILEX Orchestrator Upgrade Plan — Vantrilex Agentic Workbench & Launcher

## 1. System Identity

Vantrilex Agentic Workbench & Launcher is an upstream fork of `stablyai/orca`
maintained at `O:\Claude Code\vantrilex-orca\`. It turns the Orca ADE
(multi-agent desktop environment) into a personal agentic workbench: silent
project provisioning, conversational Arabic voice control, an embedded runner
terminal, and one-click Windows distribution.

The pristine donor repository at `O:\Claude Code\vantrilex-ts\` (health score
100/100, 116 passing tests) is the read-only source for portable logic
(detection, document generation, skills, ledger, guard hooks). Orca-native
surface (ADE layout, worktrees, terminal stack, preload bridge) is never
redesigned, only extended with isolated modules.

## 2. Architectural Invariants

1. **Native Orca UI is preserved at 100%.** No redesign, no restyle of
   `components/ui/` primitives. Additions are discrete triggers only.
2. **Zero wizards.** Provisioning, pairing, and voice setup run silently in
   the background; the user sees toasts, never modal flows.
3. **Donor flows one way.** Portable logic is ported from `vantrilex-ts`;
   Orca-specific wiring is written natively. Never back-port fork code.
4. **English inside, Ammani outside.** Code, UI chrome, terminal, and logs
   stay in English. Spoken conversational output is exclusively authentic
   Ammani Jordanian Arabic.
5. **Zero plaintext secrets.** API keys live in OS DPAPI `safeStorage`;
   status queries report presence booleans only; logs never print secrets.
6. **Atomic Conventional Commits, push per phase.** Every step lands as
   small reversible commits; each phase ends with a remote sync.
7. **Tests gate every step.** `tsc --noEmit` (node + web), `oxlint`
   (including the design-system and react-doctor configs), `oxfmt`, and the
   Vitest suites for touched areas must be green before `/sync`.

## 3. Stack

| Layer | Choice | Location |
|---|---|---|
| Runtime shell | Electron 39, Node 25 | `package.json`, `electron.vite.config.ts` |
| Package manager | pnpm 12 | `pnpm-workspace.yaml`, `pnpm-lock.yaml` |
| Renderer | React 19, Vite 7, TailwindCSS, shadcn primitives | `src/renderer/` |
| Terminal | node-pty + ConPTY (Windows), xterm.js panel | Orca terminal stack |
| IPC | Typed preload bridge `window.api`, IPC handlers in main | `src/preload/`, `src/main/` |
| TTS | Fish Audio direct API, model `s2.1-pro-free`, MP3 output | Step 4, `src/main/voice/` |
| STT | Groq Whisper `whisper-large-v3-turbo` | Step 4, `src/main/voice/` |
| Cognitive brain | `openai/gpt-oss-120b` on Groq LPU | Step 4, `src/main/voice/` |
| Keyring | Electron `safeStorage` (DPAPI on Windows), 10-request rotation | Step 4, `src/main/keyring/` |
| Runners | Claude Code, OpenCode, Codex CLIs via argv builders | Step 5/6, terminal panel |
| Packaging | electron-builder NSIS x64, `dist/win-unpacked/` | Step 7 |
| Mobile relay | Self-hosted Happy Coder relay, `vendor/happy/` | Step 6 |

## 4. The 7-Step Roadmap

### Step 1: Upstream Clone & Structural Inventory [x] COMPLETED

- Forked `stablyai/orca` at commit `96c1dd8b70`.
- Verified pnpm 12 install, Electron 39 boot, React 19 renderer, native
  node-pty terminal stack, worktree split surface.
- Recorded inventory in fork docs; no migration code yet.

### Step 2: Cinematic Space-Warp Splash Screen [x] COMPLETED

- Canvas particle warp engine: `src/renderer/src/components/splash/splash-starfield.ts`.
- Emblem reveal at 3.5s, auto-advance at 6.0s, instant skip on click or keypress.
- Non-blocking fade into the native Orca ADE; commit `5e2768f6c8`.

### Step 2.5: Tooling Arming & Physical Gate [x] COMPLETED

- Materialized `.claude/skills/` (foundry + guard + persona set),
  `.claude/agents/`, `.claude/hooks/`, `.mcp.json`
  (filesystem, fetch, memory, sequential-thinking).
- Tooling-to-step matrix recorded in `docs/16-WORKFLOWS.md` and
  `docs/10-CHECKPOINT.md`; commit `bc23e6d881`.

### Step 3: Silent Background Foundry Migration [x] COMPLETED

Commits `6ded2fc827` (docs split), `e5193c2835` (main modules),
`992de9eae0` (preload/renderer wiring).

| Component | Path | Contract |
|---|---|---|
| Detection (3 cases) | `src/main/foundry/foundry-detect.ts` | `detectFoundryCase(workspace)` → case 1 greenfield / 2 partial / 3 provisioned; suite `foundry-detect.test.ts` |
| 28-file generator | `src/main/foundry/foundry-documents-foundation.ts` (12), `foundry-documents-execution.ts` (8), `foundry-documents-governance.ts` (8), barrel `foundry-docs.ts` | `scaffoldDocs(workspace, name, { immuneSummary })` → `{ created, kept }`; all entries byte-identical to donor; suite `foundry-docs.test.ts` asserts count 28 |
| Template + marker | `src/main/foundry/foundry-document-template.ts` | `doc()`, `FOUNDRY_META` marker comment |
| 7 core skills | `src/main/foundry/foundry-skills.ts` | `provisionCoreSkills(workspace)` → `{ created, kept }` |
| 60-entry immune ledger | `src/main/foundry/foundry-immune-ledger.ts` + `.json` | `loadLedger()`, `immunologySummary()` appended to AI-INSTRUCTIONS |
| Checkpoint writer | `src/main/foundry/foundry-checkpoint.ts` | Atomic ledger writes under app data dir |
| Guard hook | `src/main/foundry/foundry-guard-hook.ts` | Pre-tool plan-gate validation |
| IPC | `src/main/foundry/foundry-ipc.ts`, bootstrap in `src/main/startup/main-process-ipc-bootstrap.ts` | `foundry:detect`, `foundry:provision` channels |
| Preload bridge | `src/preload/api/foundry-api.ts`, `foundry-bridge.ts`, `api-types.ts`, `index.ts` | `window.api.foundry.detect/provision`, typed results |
| Renderer worker | `src/renderer/src/components/foundry/use-foundry-background-provision.ts` | Bound to `useActiveRepo()?.path` in `App.tsx`; detached async run, cancellation-safe |
| Toast bus + UI | `foundry-toast-bus.ts`, `FoundryToasts.tsx` | `pushFoundryToast`, `subscribeFoundryToasts`; `role="status"` region, `scrollbar-sleek` token |
| Web fallback | `src/renderer/src/web/preload-api/web-foundry-api.ts` | Browser-seam parity |

Zero wizards: toasts only (`Scanning workspace in background…`, `Workspace configured`).

### Step 4: Voice Pipeline & Ammani Arabic Brain [ ] NEXT IN QUEUE

| Subsystem | Specification | Budget / Path |
|---|---|---|
| TTS | Fish Audio direct API, model `s2.1-pro-free`; default male voice reference `5b90451e0cd34b2788841744af7c55c3`, toggle female `88c0375e46fa4e3b929755fa077ca5ad`; local LRU MP3 cache; Chromium native audio playback | Cache hit < 300ms; synthesis < 1.5s |
| STT | Groq Whisper `whisper-large-v3-turbo` | Transcription < 1.0s for < 30s clips |
| Brain | `openai/gpt-oss-120b` on Groq LPU | **Golden 2.0s, ceiling 5.0s** end-to-end utterance |
| Language | Spoken output strictly authentic Ammani Jordanian Arabic; code/UI/terminal remain English | `docs/18-VOICE-PIPELINE.md` policy |
| RAG corpora | Dialect/phonetics: JODA, APGC, `camel_tools`, MADAR; conciseness/BLUF: xl-sum; governance: Prompt-Engineering-Guide | 9 corpora, local index |
| Keyring | OS DPAPI `safeStorage`; pools for `FISH_AUDIO_API_KEY`, `GROQ_API_KEY`; **auto-rotation every exactly 10 requests** | `src/main/keyring/`, `docs/20-KEYRING.md` |
| Local tools | Orca control tools + SKILL.md: inspect worktrees, diffs, launch runners | `docs/18-VOICE-PIPELINE.md` |

### Step 5: Native Embedded Terminal Panel [ ] QUEUED

- Multi-tab xterm.js + ConPTY panel inside the Orca ADE layout.
- Concurrent Claude Code, OpenCode, Codex sessions; no external windows.
- Runner argv builders, stdio inheritance, env injection, Windows `.cmd`
  spawn handling per `docs/reference/windows-terminal-shell-selection.md`.

### Step 6: Minimal Non-Intrusive UI Controls [ ] QUEUED

100% native Orca layout preserved. Four discrete triggers only:

| Control | Target |
|---|---|
| Microphone toggle | Voice pipeline mute/unmute |
| Project Showcase button | `docs/showcase.html` per DESIGN.md warm-cream `#faf9f5` / coral `#cc785c` tokens |
| Happy Coder QR modal | Self-hosted relay in `vendor/happy/` for remote step approvals |
| Voice selector | Male/female voice toggle, persistent |

Strict ban on cyber-cyan restyles; `pnpm run check:code-quality:changed`
and `pnpm run lint:design-system` gate every renderer touch.

### Step 7: Production Hardening, Packaging & Release [ ] QUEUED

- Windows x64 NSIS one-click installer via electron-builder
  (`dist/win-unpacked/` staging, `pnpm install:release` for arch deps).
- Zero plaintext secrets audit, CSP lockdown, glibc 2.31 floor respected
  for bundled natives.
- 100% green suite, official `v1.0.0` release tag.

### Future Horizon (v2.0)

Sovereign Vantrilex DeepSeek Harness (`deepseek-ai/deepseek-harness` fork,
native branding, plugin integration) inside the Orca ADE.

## 5. Tooling-to-Step Matrix

| Step | Skills | Personas | MCPs |
|---|---|---|---|
| Step 3 (Foundry) | `tdd`, `clean-code-guard`, `test-guard`, `docs-guard`; `vantrilex-project-founder`, `vantrilex-project-onboarder`, `vantrilex-project-reverse-engineer`, `vantrilex-stack-selector` | `architect`, `refactoring-specialist` | filesystem, fetch, memory, sequential-thinking |
| Step 4 (Voice) | Prompt-engineering skills, dialect rules, voice SKILL.md | `architect` | fetch (provider APIs), memory (voice prefs) |
| Step 5 (Terminal) | PTY/terminal integration skills | `architect`, `refactoring-specialist` | — (local PTY) |
| Step 6 (UI) | Showcase builder, mobile pairing skills | `architect` | — |
| Step 7 (Release) | Hardening checklists, packaging runbooks | `architect` | — |

## 6. Governance Rules

1. `/plan → /code → /test → /sync` gates every change; `/plan` records a
   checkpoint in `docs/10-CHECKPOINT.md` first.
2. `git stash create` before `/code` on dirty trees; rollback prompt after
   more than 3 `/test` failures (circuit-breaker: max 3 attempts per
   hypothesis, one variable per attempt).
3. Guard skills run on their surfaces: `clean-code-guard` (production
   code), `test-guard` (tests), `docs-guard` (docs), `wp-guard`/`woo-guard`
   where applicable.
4. Secrets hygiene: key names and voice reference IDs in docs only; never
   key values, never tokens in logs, screenshots, or transcripts.
5. `docs-guard`: every referenced symbol verified against source; every
   code sample runnable; no unverifiable performance claims.
6. Windows-first verification: `runProcess`/`spawnProcess` wrappers, no
   bare `child_process`, no `shell: true`, `.cmd` shim resolution honored.
7. No push without explicit instruction; no destructive git operations.

## 7. Disaster Recovery

| Failure | Response |
|---|---|
| Failed `/test` gate (>3 attempts) | Automated rollback prompt to the recorded `git stash create` hash |
| Broken worktree | Primary worktree rule: all work in the primary directory; fresh clone + cherry-pick of atomic commits |
| Leaked secret | Revoke at provider, rotate keyring pool, grep history, record in `docs/09-DECISIONS.md` |
| Red toolchain (lint/type/test) | Fix-forward only inside the step scope; never bundle unrelated repairs |
| Lost checkpoint doc | `docs/` is git-tracked; restore from `HEAD`, re-append live entries from session notes |
