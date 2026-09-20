export type ExecResult = {
  stdout: string
  code: number
}

export type ExecFn = (argv: string[], cwd: string) => Promise<ExecResult>

export class ToolError extends Error {
  readonly code: number
  constructor(command: string, code: number) {
    super(`Tool '${command}' exited with code ${code}`)
    this.name = 'ToolError'
    this.code = code
  }
}

async function runChecked(exec: ExecFn, argv: string[], cwd: string): Promise<string> {
  const result = await exec(argv, cwd)
  if (result.code !== 0) {
    throw new ToolError(argv.join(' '), result.code)
  }
  return result.stdout
}

export async function listWorktrees(exec: ExecFn, cwd: string): Promise<string[]> {
  const stdout = await runChecked(exec, ['git', 'worktree', 'list', '--porcelain'], cwd)
  return stdout
    .split('\n')
    .filter((line) => line.startsWith('worktree '))
    .map((line) => line.slice('worktree '.length).trim())
    .filter((path) => path !== '')
}

export type DiffSummary = {
  files: string[]
  insertions: number
  deletions: number
}

export async function summarizeDiff(exec: ExecFn, cwd: string): Promise<DiffSummary> {
  const stdout = await runChecked(exec, ['git', 'diff', '--numstat'], cwd)
  const files: string[] = []
  let insertions = 0
  let deletions = 0
  for (const line of stdout.split('\n')) {
    const parts = line.split('\t')
    if (parts.length !== 3) {
      continue
    }
    const [added, removed, path] = parts as [string, string, string]
    files.push(path)
    if (added !== '-' && removed !== '-') {
      insertions += Number(added)
      deletions += Number(removed)
    }
  }
  return { files, insertions, deletions }
}
