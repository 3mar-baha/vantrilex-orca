export type FoundryDoc = {
  path: string
  body: string
}

export const FOUNDRY_META = '<!-- Vantrilex Foundry Scaffolding: v1.0.0 -->'

export function doc(title: string, purpose: string, status: string, schema: string): string {
  return `# ${title}\n\n${FOUNDRY_META}\n\n## Purpose\n\n${purpose}\n\n## Status\n\n${status}\n\n## Schema\n\n${schema}\n`
}
