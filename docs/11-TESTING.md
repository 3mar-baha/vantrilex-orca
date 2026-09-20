# 11 — Testing — Vantrilex Agentic Workbench & Launcher

## Purpose

Test layers, commands, and justification discipline for the fork.

## Status

Every change cites the command run and its result in the workflow log.
TDD red-green-refactor is mandatory for new behavior.

## Schema

### Layers

| Layer | Suite | Command | Threshold |
|---|---|---|---|
| Detection | `src/main/foundry/foundry-detect.test.ts` | `vitest run src/main/foundry` | 3 cases + manifest edge cases, all green |
| Scaffold | `src/main/foundry/foundry-docs.test.ts` | same | 28-count assertion, create/keep round-trip |
| Toast bus | `foundry-toast-bus.test.ts` | `vitest run src/renderer/src/components/foundry` | subscribe/push/dismiss/reset |
| Background provision | `use-foundry-background-provision.test.tsx` | same | detached run, null-path no-op, toast assertions |
| Typecheck | node + web configs | `tsc --noEmit -p config/tsconfig.node.json`, `...web.json` | zero errors |
| Lint | oxlint base + design-system + react-doctor | `oxlint <touched>`, `pnpm run check:code-quality:changed` | zero errors |
| Format | oxfmt | `oxfmt --check` | zero diffs |

### Justification

Each test answers what bug it catches that no other test catches. Tests
without an answer are deleted (test-guard Rules 3–4). Behavior over
implementation: assert return values and observable side effects, never
internal call shapes. Mocks live only at system boundaries (filesystem,
IPC, timers). Production regression tests are sacred and cite the
incident.

### Coverage

New modules ship with their suites in the same commit. Touched-area
suites run before every `/sync`; the full suite runs before release
(Step 7). A red gate blocks the commit — no exceptions, no skips.
