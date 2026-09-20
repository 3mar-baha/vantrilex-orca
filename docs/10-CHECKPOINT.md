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
