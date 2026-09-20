import { mkdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { FOUNDRY_DOCS_EXECUTION } from './foundry-documents-execution'
import { FOUNDRY_DOCS_FOUNDATION } from './foundry-documents-foundation'
import { FOUNDRY_DOCS_GOVERNANCE } from './foundry-documents-governance'
import type { FoundryDoc } from './foundry-document-template'

export { FOUNDRY_META } from './foundry-document-template'

export type ScaffoldResult = {
  created: string[]
  kept: string[]
}

export const FOUNDRY_DOCS: FoundryDoc[] = [
  ...FOUNDRY_DOCS_FOUNDATION,
  ...FOUNDRY_DOCS_EXECUTION,
  ...FOUNDRY_DOCS_GOVERNANCE
]

export type ScaffoldOptions = {
  immuneSummary?: string
}

function exists(path: string): boolean {
  try {
    statSync(path)
    return true
  } catch {
    return false
  }
}

export function scaffoldDocs(
  workspace: string,
  projectName: string,
  options: ScaffoldOptions = {}
): ScaffoldResult {
  const trimmed = projectName.trim()
  const fallback = workspace.split(/[\\/]/).findLast((segment) => segment !== '') ?? 'project'
  const name = trimmed === '' ? fallback : trimmed
  const created: string[] = []
  const kept: string[] = []
  for (const dir of ['docs', 'docs/ai', 'docs/reports']) {
    mkdirSync(join(workspace, dir), { recursive: true })
  }
  for (const file of FOUNDRY_DOCS) {
    let body = file.body.split('{{PROJECT}}').join(name)
    if (file.path === 'docs/ai/AI-INSTRUCTIONS.md' && options.immuneSummary) {
      body += `\n${options.immuneSummary}`
    }
    const abs = join(workspace, file.path)
    if (exists(abs)) {
      kept.push(file.path)
      continue
    }
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, body, 'utf8')
    created.push(file.path)
  }
  return { created, kept }
}
