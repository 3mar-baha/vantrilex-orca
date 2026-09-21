import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

export class OrchestratorError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OrchestratorError'
  }
}

export type ProjectState = {
  checkpoint: string | null
  roadmap: string | null
  diff: string
}

export type OrchestratorDeps = {
  brain: { think: (prompt: string) => Promise<{ reply: string; ms: number }> }
  readProjectState: (workspace: string) => Promise<ProjectState>
  inject: (prompt: string) => Promise<{ sessionId: string }>
  rearm: (sessionId: string) => void
}

export function buildEngineeringPrompt(directive: string, state: ProjectState): string {
  return [
    'Template-M production prompt engineering.',
    'Turn the owner directive below into one comprehensive, production-grade',
    'instruction for the active runner. Use the project state for grounding.',
    'Do not ask questions. Do not restate these instructions.',
    '',
    `Owner directive: ${directive}`,
    '',
    'Active checkpoint:',
    state.checkpoint ?? '(no checkpoint recorded)',
    '',
    'Roadmap context:',
    state.roadmap ?? '(no roadmap recorded)',
    '',
    'Recent diff:',
    state.diff === '' ? '(clean tree)' : state.diff
  ].join('\n')
}

function readFirstExisting(paths: string[]): string | null {
  for (const path of paths) {
    try {
      return readFileSync(path, 'utf8')
    } catch {
      continue
    }
  }
  return null
}

export async function readWorkspaceState(workspace: string): Promise<ProjectState> {
  const checkpoint = readFirstExisting([
    join(workspace, 'docs', '10-CHECKPOINT.md'),
    join(workspace, 'docs', 'HANDOFF.md')
  ])
  const roadmap = readFirstExisting([
    join(workspace, 'docs', '08-ROADMAP.md'),
    join(workspace, 'docs', 'TIMELINE.md')
  ])
  let diff = ''
  try {
    diff = execFileSync('git', ['-C', workspace, 'diff', '--stat'], {
      encoding: 'utf8',
      timeout: 10_000
    }) as string
  } catch {
    diff = ''
  }
  return { checkpoint, roadmap, diff: diff.trim() }
}

export async function orchestrateDirective(
  deps: OrchestratorDeps,
  directive: string,
  workspace: string
): Promise<{ prompt: string; sessionId: string }> {
  if (directive.trim() === '') {
    throw new OrchestratorError('Directive must not be blank')
  }
  let state: ProjectState
  try {
    state = await deps.readProjectState(workspace)
  } catch (error) {
    throw new OrchestratorError(`Cannot read project state: ${(error as Error).message}`)
  }
  const engineered = buildEngineeringPrompt(directive, state)
  const { reply: prompt } = await deps.brain.think(engineered)
  const { sessionId } = await deps.inject(prompt)
  deps.rearm(sessionId)
  return { prompt, sessionId }
}
