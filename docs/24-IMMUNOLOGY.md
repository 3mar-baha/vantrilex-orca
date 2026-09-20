# 24 — Immunology — Vantrilex Agentic Workbench & Launcher

## Purpose

The 60-entry immune failure-mode ledger: project memory that stops
repeat failures before execution.

## Status

Live. Bundled at `src/main/foundry/foundry-immune-ledger.json`, read
by `foundry-immune-ledger.ts`, summarized into AI-INSTRUCTIONS at
provision time.

## Schema

### Ledger shape

Each entry: `{ id, category, symptom, solution, cmd? }`. Categories
index by failure family (spawn, IPC, formatting, testing, packaging,
voice, relay, secrets, …). The `cmd` field holds the exact recovery
command where one exists.

### Pre-execution validation

Before a plan executes, its steps are scanned against ledger
categories: any step matching a known symptom must cite the entry ID
and apply the recorded solution, or record why it does not apply.
Skipped validations are audit findings.

### Non-destructive write invariants

Immune knowledge never mutates workspace state: the ledger is
read-only at runtime; its only write path is the one-time summary
append to generated AI-INSTRUCTIONS. Ledger updates (new entries from
incidents) land as donor-synced JSON changes with a decision reference,
in their own commits.

### Growth policy

New incidents append entries; entries never delete. IDs are stable and
citable in workflow logs. At 200 entries the ledger splits by category
file with an index — not before.
