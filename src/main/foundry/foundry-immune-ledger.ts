import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export type ImmunologyEntry = {
  id: string
  category: string
  symptom: string
  cause: string
  solution: string
  cmd: string
}

let cache: ImmunologyEntry[] | null = null
let cachePath: string | null = null
let parseError: string | null = null

export function defaultLedgerPath(): string {
  return join(import.meta.dirname, 'foundry-immune-ledger.json')
}

export function loadLedger(ledgerPath: string = defaultLedgerPath()): ImmunologyEntry[] {
  const key = resolve(ledgerPath)
  if (cache && cachePath === key) {
    return cache
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(key, 'utf8'))
    if (!Array.isArray(parsed)) {
      throw new Error('ledger root is not an array')
    }
    cache = parsed as ImmunologyEntry[]
    cachePath = key
    parseError = null
  } catch (err) {
    parseError = `${key}: ${(err as Error).message}`
    cache = []
    cachePath = key
  }
  return cache
}

export function ledgerError(): string | null {
  return parseError
}

export function resetLedgerCache(): void {
  cache = null
  cachePath = null
  parseError = null
}

export function ledgerCategories(entries: ImmunologyEntry[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const e of entries) {
    if (!seen.has(e.category)) {
      seen.add(e.category)
      out.push(e.category)
    }
  }
  return out
}

export function immunologySummary(entries: ImmunologyEntry[]): string {
  if (entries.length === 0) {
    return ''
  }
  const lines: string[] = [
    '',
    `## Immune Ledger (${entries.length} entries)`,
    '',
    'Battle-tested fixes for repetitive failure modes. Consult before debugging.',
    ''
  ]
  let last = ''
  for (const e of entries) {
    if (e.category !== last) {
      lines.push(`### ${e.category}`, '')
      last = e.category
    }
    const cmd = e.cmd.trim() === '' ? '' : ` (\`${e.cmd}\`)`
    lines.push(`- **${e.id}**: ${e.symptom} → ${e.solution}${cmd}`)
  }
  return `${lines.join('\n')}\n`
}
