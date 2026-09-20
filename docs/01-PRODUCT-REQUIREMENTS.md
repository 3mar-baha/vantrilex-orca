# 01 — Product Requirements — Vantrilex Agentic Workbench & Launcher

## Purpose

The single problem, users, value, and scope boundaries for the Vantrilex
fork of the Orca ADE, in plain words.

## Status

Ratified. Every requirement carries an ID and a verification method. A
requirement without verification is a wish.

## Schema

### Problem

A technical owner runs several AI coding runners (Claude Code, OpenCode,
Codex) across many project worktrees, and wants voice-driven, hands-free
supervision of that fleet — but every new workspace starts bare: no agent
instructions, no checkpoint discipline, no project memory. The owner repeats
the same bootstrap conversation with every agent, in every repository, and
has no uniform way to speak to the fleet, inspect what it changed, or ship
the result from one calm surface.

### Users and value

| Persona | Outcome | Minimum metric |
|---|---|---|
| Owner-operator (Omar) | Opens any repo and finds it already provisioned: agent instructions, architecture map, checkpoint ledger, guard skills | Time from repo-open to first supervised agent run under 60 seconds |
| Voice supervisor | Speaks Ammani Arabic commands and hears Ammani Arabic status while runners work | End-to-end voice utterance inside the 2.0s golden budget |
| Mobile approver | Approves or rejects remote agent steps from a phone without opening the desktop | Approval round-trip under 30 seconds over the self-hosted relay |
| Release packager | Produces a signed Windows installer from a green tree with one command | NSIS artifact from `HEAD` with zero manual steps |

### Runner CLI ownership

Agents own their models and subscriptions. Vantrilex never proxies model
traffic and never stores model credentials: it launches runner CLIs as child
processes, injects only workspace context (paths, env passthrough), and
reads their terminal output. Model failures belong to the runner; launch,
supervision, and teardown belong to Vantrilex.

### Scope boundaries

Vantrilex explicitly does not: host models, re-sell inference, redesign the
Orca ADE layout, replace the runner CLIs' own prompting, store plaintext
secrets, or send workspace content to any party except the provider APIs
the owner configured (Fish Audio, Groq) for the voice path only.

### Acceptance

| ID | Requirement | Verification |
|---|---|---|
| REQ-001 | Any opened repo is detected (3 cases) and provisioned silently | `foundry-detect.test.ts` + `foundry-docs.test.ts` green |
| REQ-002 | Provisioning never blocks the UI and never opens a wizard | Toast-only suites green; manual open-repo timing |
| REQ-003 | Voice speaks and hears Ammani Arabic within latency budgets | `docs/18-VOICE-PIPELINE.md` benchmarks |
| REQ-004 | No secret value ever touches disk, logs, or the renderer | Security audit per `docs/12-SECURITY.md` |
| REQ-005 | One-command Windows installer from a green tree | `docs/15-DISTRIBUTION.md` packaging run |
