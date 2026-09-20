# 07 — Implementation Plan — Vantrilex Agentic Workbench & Launcher

## Purpose

Ordered build sequence from forked tree to shippable v1.0.0 increment.

## Status

Steps execute through `docs/16-WORKFLOWS.md` gates only. Steps 1–3 are
done; Step 4 is next in queue.

## Schema

### Phases

| Phase | Entry criteria | File-level changes | Test command | Exit criteria |
|---|---|---|---|---|
| 1. Clone & inventory | Upstream URL + base commit | Fork checkout, inventory notes | Boot app, open worktree | App runs, inventory recorded |
| 2. Splash | Particle spec approved | `splash-starfield.ts`, splash host, skip wiring | Splash timing tests | 3.5s reveal, 6.0s advance, instant skip |
| 2.5 Tooling | Skill/MCP list frozen | `.claude/`, `.mcp.json`, workflow matrix docs | Tool presence check | Matrix recorded |
| 3. Foundry | Donor modules read | `src/main/foundry/*`, preload bridge, worker, toasts, `App.tsx` hookup | `vitest src/main/foundry src/renderer/src/components/foundry`, `tsc` node+web, `oxlint` | 12/12 green, 3 atomic commits |
| 4. Voice | Provider accounts + voice IDs | `src/main/voice/*`, `src/main/keyring/*`, mic/voice UI | Latency benchmark + unit suites | Golden 2.0s / ceiling 5.0s met |
| 5. Terminal | PTY contract reviewed | Embedded xterm panel, runner argv builders | Concurrency + resize suites | 3 runners concurrently, no external windows |
| 6. Controls | DESIGN.md tokens frozen | 4 discrete triggers, `showcase.html`, `vendor/happy/` relay | Design-system lint + pairing flow | Zero layout diff, approval round-trip < 30s |
| 7. Release | All suites green | electron-builder config, CSP, audit fixes | Full suite + packaging run | NSIS artifact, v1.0.0 tag |

No phase starts until the prior gate is green.

### Provisioned tooling

Donor-to-fork migration reuses the Tooling-to-Step matrix
(`docs/VANTRILEX_ORCHESTRATOR_UPGRADE_PLAN.md` §5): guard skills on every
phase, `architect` persona on structural work, filesystem/fetch/memory
MCPs where the step table assigns them. Rejected near-misses (custom UI
redesign, model proxying, plaintext key files) stay rejected; re-litigating
them requires a new `docs/09-DECISIONS.md` entry.
