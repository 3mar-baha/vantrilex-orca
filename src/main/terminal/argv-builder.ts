export type RunnerCli = 'claude' | 'opencode' | 'codex'

export type ArgvRequest = {
  cli: string
  workspace: string
  resume?: boolean
  extraFlags?: readonly string[]
}

export type RunnerArgv = {
  program: string
  args: readonly string[]
}

export class ArgvError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ArgvError'
  }
}

const PROGRAMS: Record<RunnerCli, string> = {
  claude: 'claude',
  opencode: 'opencode',
  codex: 'codex'
}

const RESUME_FLAGS: Record<RunnerCli, string> = {
  claude: '--continue',
  opencode: '--continue',
  codex: '--resume'
}

const EXTRA_ALLOW_LIST: Record<RunnerCli, readonly string[]> = {
  claude: ['--verbose', '--print'],
  opencode: ['--verbose', '--print'],
  codex: ['--verbose', '--print']
}

function isRunnerCli(cli: string): cli is RunnerCli {
  return cli === 'claude' || cli === 'opencode' || cli === 'codex'
}

export function buildRunnerArgv(request: ArgvRequest): RunnerArgv {
  if (!isRunnerCli(request.cli)) {
    throw new ArgvError(`Unknown runner cli '${request.cli}'`)
  }
  if (request.workspace.trim() === '') {
    throw new ArgvError('Runner argv requires a non-empty workspace')
  }
  const args: string[] = []
  if (request.resume === true) {
    args.push(RESUME_FLAGS[request.cli])
  }
  for (const flag of request.extraFlags ?? []) {
    if (!EXTRA_ALLOW_LIST[request.cli].includes(flag)) {
      throw new ArgvError(`Flag '${flag}' is not allow-listed for '${request.cli}'`)
    }
    args.push(flag)
  }
  return { program: PROGRAMS[request.cli], args }
}
