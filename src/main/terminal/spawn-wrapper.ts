import { resolveSpawn, type ResolvedSpawn } from '../../shared/child-process/spawn-resolution'

export type RunnerSpawnRequest = {
  program: string
  args: readonly string[]
  cwd: string
  env?: NodeJS.ProcessEnv
}

export class SpawnResolutionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SpawnResolutionError'
  }
}

export function resolveRunnerSpawn(
  request: RunnerSpawnRequest,
  platform: NodeJS.Platform = process.platform
): ResolvedSpawn {
  if (request.program.trim() === '' || request.cwd.trim() === '') {
    throw new SpawnResolutionError('Runner spawn requires a program and cwd')
  }
  return resolveSpawn(
    { program: request.program, args: request.args, cwd: request.cwd, env: request.env },
    platform
  )
}
