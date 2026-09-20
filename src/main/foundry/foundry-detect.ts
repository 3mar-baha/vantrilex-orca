import { globSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { readFileTrimmedSize } from './foundry-fs'

export const enum FoundryCase {
  Fresh = 1,
  ExistingWithoutDocs = 2,
  ExistingWithOutdatedDocs = 3
}

export type CaseDetails = {
  projectCase: FoundryCase
  language: string
  stack: string
  action: string
}

export const DOC_COMPLETENESS_BYTES = 200

const MANIFESTS: readonly { file: string; language: string; stack: string }[] = [
  { file: 'package.json', language: 'JavaScript/TypeScript', stack: 'Node.js' },
  { file: 'go.mod', language: 'Go', stack: 'Go modules' },
  { file: 'Cargo.toml', language: 'Rust', stack: 'Cargo' },
  { file: 'pyproject.toml', language: 'Python', stack: 'PEP 517' },
  { file: 'Makefile', language: 'Polyglot', stack: 'Make' }
]

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

function findManifest(dir: string): { file: string; language: string; stack: string } | null {
  for (const m of MANIFESTS) {
    if (isFile(join(dir, m.file))) {
      return m
    }
  }
  const hits = globSync('*.sln', { cwd: dir }).sort()
  if (hits.length > 0 && hits[0] !== undefined) {
    return { file: hits[0], language: '.NET', stack: 'MSBuild' }
  }
  return null
}

function hasCanonicalDocs(dir: string): boolean {
  return (
    readFileTrimmedSize(join(dir, 'docs', '01-PRODUCT-REQUIREMENTS.md')) > DOC_COMPLETENESS_BYTES ||
    readFileTrimmedSize(join(dir, 'docs', '04-ARCHITECTURE.md')) > DOC_COMPLETENESS_BYTES
  )
}

function caseAction(c: FoundryCase): string {
  switch (c) {
    case FoundryCase.Fresh:
      return 'Run vantrilex-project-founder: interview, draft the 28-file spec, select stack.'
    case FoundryCase.ExistingWithoutDocs:
      return 'Run vantrilex-project-reverse-engineer: read code as truth, rebuild docs.'
    case FoundryCase.ExistingWithOutdatedDocs:
      return 'Run vantrilex-project-onboarder: ingest architecture, expand, update workflows.'
    default:
      return 'Re-run detection after choosing the workspace folder.'
  }
}

export function caseName(c: FoundryCase): string {
  switch (c) {
    case FoundryCase.Fresh:
      return 'Case 1 — Fresh workspace'
    case FoundryCase.ExistingWithoutDocs:
      return 'Case 2 — Existing without docs'
    case FoundryCase.ExistingWithOutdatedDocs:
      return 'Case 3 — Existing with outdated docs'
    default:
      return 'Unknown case'
  }
}

export function detectProjectCase(workspace: string): CaseDetails {
  if (!hasManifests(workspace)) {
    return {
      projectCase: FoundryCase.Fresh,
      language: 'None yet',
      stack: 'Greenfield',
      action: caseAction(FoundryCase.Fresh)
    }
  }
  const manifest = findManifest(workspace)
  const language = manifest ? manifest.language : 'Unknown'
  const stack = manifest ? manifest.stack : 'Unknown'
  if (hasCanonicalDocs(workspace)) {
    return {
      projectCase: FoundryCase.ExistingWithOutdatedDocs,
      language,
      stack,
      action: caseAction(FoundryCase.ExistingWithOutdatedDocs)
    }
  }
  return {
    projectCase: FoundryCase.ExistingWithoutDocs,
    language,
    stack,
    action: caseAction(FoundryCase.ExistingWithoutDocs)
  }
}

function hasManifests(dir: string): boolean {
  for (const m of MANIFESTS) {
    if (isFile(join(dir, m.file))) {
      return true
    }
  }
  return globSync('*.sln', { cwd: dir }).length > 0
}
