import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const GUARD_REL = '.claude/hooks/block-unplanned-edits.json'

const GUARD_BODY = `{
  "name": "block-unplanned-edits",
  "event": "PreToolUse",
  "matcher": "Edit|Write",
  "checkpoint": "docs/10-CHECKPOINT.md",
  "policy": "Block edit and write tool execution unless an approved /plan is recorded in docs/10-CHECKPOINT.md with scope files, MCPs, skills, test command, and rollback step.",
  "rollback": "Before /code, run git stash create on dirty trees or tag a checkpoint on clean ones. After more than 3 /test failures, prompt automated rollback to the checkpoint before further edits."
}
`

export function applyFoundryGuard(workspace: string): string[] {
  const abs = join(workspace, GUARD_REL)
  if (existsSync(abs)) {
    return []
  }
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, GUARD_BODY, 'utf8')
  return [GUARD_REL]
}
