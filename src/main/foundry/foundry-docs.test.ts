import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { FOUNDRY_DOCS, scaffoldDocs } from './foundry-docs'
import { applyFoundryGuard } from './foundry-guard-hook'
import { hasCheckpoint, primeCheckpoint } from './foundry-checkpoint'
import { provisionCoreSkills } from './foundry-skills'
import { immunologySummary, loadLedger } from './foundry-immune-ledger'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true })
  }
})

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'vtx-fork-docs-'))
  dirs.push(dir)
  return dir
}

describe('foundry 28-file scaffolding', () => {
  it('defines 28 unique paths with metadata and sections', () => {
    expect(FOUNDRY_DOCS.length).toBe(28)
    const seen = new Set<string>()
    for (const doc of FOUNDRY_DOCS) {
      expect(seen.has(doc.path)).toBe(false)
      seen.add(doc.path)
      expect(doc.body).toContain('<!-- Vantrilex Foundry Scaffolding: v1.0.0 -->')
      for (const section of ['## Purpose', '## Status', '## Schema']) {
        expect(doc.body, `${doc.path} missing ${section}`).toContain(section)
      }
    }
  })

  it('scaffolds non-destructively with substitution and immune injection', () => {
    const ws = tempDir()
    const first = scaffoldDocs(ws, 'demo', { immuneSummary: immunologySummary(loadLedger()) })
    expect(first.created.length).toBe(28)
    const ai = readFileSync(join(ws, 'docs', 'ai', 'AI-INSTRUCTIONS.md'), 'utf8')
    expect(ai).toContain('Strict Zero-Action-Without-Plan Policy')
    expect(ai).toContain('## Immune Ledger (60 entries)')
    expect(ai).not.toContain('{{PROJECT}}')
    const second = scaffoldDocs(ws, 'demo', {})
    expect(second.created).toEqual([])
    expect(second.kept.length).toBe(28)
  })

  it('provisions skills, guard hook, and canonical checkpoint', () => {
    const ws = tempDir()
    const skills = provisionCoreSkills(ws)
    expect(skills.created.length).toBe(7)
    const guard = applyFoundryGuard(ws)
    expect(guard).toEqual(['.claude/hooks/block-unplanned-edits.json'])
    expect(applyFoundryGuard(ws)).toEqual([])
    expect(primeCheckpoint(ws)).toBe(true)
    expect(hasCheckpoint(ws)).toBe(true)
    expect(primeCheckpoint(ws)).toBe(false)
  })
})
