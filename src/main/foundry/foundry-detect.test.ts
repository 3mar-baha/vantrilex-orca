import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { caseName, detectProjectCase, FoundryCase } from './foundry-detect'

const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'vtx-fork-detect-'))
  dirs.push(dir)
  return dir
}

describe('foundry 3-case detection', () => {
  it('classifies empty and .git-only dirs as fresh', () => {
    expect(detectProjectCase(tempDir()).projectCase).toBe(FoundryCase.Fresh)
    const gitOnly = tempDir()
    mkdirSync(join(gitOnly, '.git'))
    const details = detectProjectCase(gitOnly)
    expect(details.projectCase).toBe(FoundryCase.Fresh)
    expect(details.action).toContain('vantrilex-project-founder')
  })

  it('classifies manifests without docs as undocumented', () => {
    const dir = tempDir()
    writeFileSync(join(dir, 'go.mod'), 'module x\n')
    const details = detectProjectCase(dir)
    expect(details.projectCase).toBe(FoundryCase.ExistingWithoutDocs)
    expect(details.language).toBe('Go')
    expect(details.action).toContain('vantrilex-project-reverse-engineer')
  })

  it('classifies complete canonical docs as outdated-docs case', () => {
    const dir = tempDir()
    writeFileSync(join(dir, 'package.json'), `{"name":"demo","notes":"${'x'.repeat(220)}"}\n`)
    mkdirSync(join(dir, 'docs'))
    writeFileSync(
      join(dir, 'docs', '01-PRODUCT-REQUIREMENTS.md'),
      `# Req\n\n${'Substantive content. '.repeat(20)}`
    )
    const details = detectProjectCase(dir)
    expect(details.projectCase).toBe(FoundryCase.ExistingWithOutdatedDocs)
    expect(details.language).toBe('JavaScript/TypeScript')
  })

  it('treats hollow docs as undocumented', () => {
    const dir = tempDir()
    writeFileSync(join(dir, 'Makefile'), 'all:\n')
    mkdirSync(join(dir, 'docs'))
    writeFileSync(join(dir, 'docs', '04-ARCHITECTURE.md'), '# stub\n')
    expect(detectProjectCase(dir).projectCase).toBe(FoundryCase.ExistingWithoutDocs)
  })

  it('names every case', () => {
    expect(caseName(FoundryCase.Fresh)).toContain('Case 1')
    expect(caseName(FoundryCase.ExistingWithoutDocs)).toContain('Case 2')
    expect(caseName(FoundryCase.ExistingWithOutdatedDocs)).toContain('Case 3')
  })
})
