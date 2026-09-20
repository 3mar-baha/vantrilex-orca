import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const CHECKPOINT_REL = 'docs/10-CHECKPOINT.md'

export const CHECKPOINT_TEMPLATE = `# 10 — Checkpoint

<!-- Vantrilex Foundry Scaffolding: v1.0.0 -->

## Purpose

The approved-plan ledger that gates all code changes.

## Status

Seeded by history scan; awaiting the first approved plan.

## Schema

### Active plan

No active plan recorded yet.
`

export function checkpointPath(workspace: string): string {
  return join(workspace, CHECKPOINT_REL)
}

export function hasCheckpoint(workspace: string): boolean {
  try {
    return readFileSync(checkpointPath(workspace), 'utf8').trim().length > 0
  } catch {
    return false
  }
}

export function primeCheckpoint(workspace: string): boolean {
  const path = checkpointPath(workspace)
  if (existsSync(path)) {
    return false
  }
  mkdirSync(join(workspace, 'docs'), { recursive: true })
  writeFileSync(path, CHECKPOINT_TEMPLATE, 'utf8')
  return true
}
