import { buildRunnerArgv } from './argv-builder'
import type { PtySessionManager } from './pty-manager'
import { resolveRunnerSpawn } from './spawn-wrapper'

export class TerminalValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TerminalValidationError'
  }
}

export type TerminalDeps = {
  manager: PtySessionManager
  workspaceExists: (path: string) => boolean
  platform?: NodeJS.Platform
}

const DEFAULT_COLS = 80
const DEFAULT_ROWS = 24
const MAX_DIMENSION = 1000
const MAX_INPUT_BYTES = 1024 * 1024

function isRecord(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === 'object' && payload !== null
}

function readString(payload: Record<string, unknown>, field: string): string {
  const value = payload[field]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TerminalValidationError(`Terminal request requires a non-empty '${field}'`)
  }
  return value
}

function readDimension(payload: Record<string, unknown>, field: string, fallback: number): number {
  const value = payload[field] ?? fallback
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > MAX_DIMENSION) {
    throw new TerminalValidationError(`Terminal request has invalid '${field}'`)
  }
  return value
}

function readLaunch(
  deps: TerminalDeps,
  payload: unknown
): { cli: string; workspace: string; cols: number; rows: number } {
  if (!isRecord(payload)) {
    throw new TerminalValidationError('Terminal request must be an object')
  }
  const workspace = readString(payload, 'workspace')
  if (!deps.workspaceExists(workspace)) {
    throw new TerminalValidationError('Terminal request requires an existing workspace directory')
  }
  return {
    cli: readString(payload, 'cli'),
    workspace,
    cols: readDimension(payload, 'cols', DEFAULT_COLS),
    rows: readDimension(payload, 'rows', DEFAULT_ROWS)
  }
}

function readSession(payload: unknown): string {
  if (!isRecord(payload)) {
    throw new TerminalValidationError('Terminal request must be an object')
  }
  return readString(payload, 'sessionId')
}

export function handleRunnerLaunch(
  deps: TerminalDeps,
  payload: unknown
): { sessionId: string; pid: number } {
  const request = readLaunch(deps, payload)
  let argv: { program: string; args: readonly string[] }
  try {
    const extra =
      isRecord(payload) && Array.isArray(payload['extraFlags'])
        ? (payload['extraFlags'] as string[])
        : []
    argv = buildRunnerArgv({
      cli: request.cli,
      workspace: request.workspace,
      resume: isRecord(payload) && payload['resume'] === true,
      extraFlags: extra
    })
  } catch (error) {
    throw new TerminalValidationError((error as Error).message)
  }
  const resolved = resolveRunnerSpawn(
    { program: argv.program, args: argv.args, cwd: request.workspace },
    deps.platform ?? process.platform
  )
  const launched = deps.manager.launch(resolved, request.workspace, request.cols, request.rows)
  return { sessionId: launched.id, pid: launched.pid }
}

export function handleRunnerInject(deps: TerminalDeps, payload: unknown): { sessionId: string } {
  if (!isRecord(payload)) {
    throw new TerminalValidationError('Terminal request must be an object')
  }
  const prompt = readString(payload, 'prompt')
  const requested =
    typeof payload['sessionId'] === 'string' && (payload['sessionId'] as string).trim() !== ''
      ? (payload['sessionId'] as string)
      : deps.manager.latestId()
  if (!requested) {
    throw new TerminalValidationError('No active runner session — open a runner tab first')
  }
  const submitted = prompt.endsWith('\n') ? prompt : `${prompt}\n`
  try {
    deps.manager.write(requested, submitted)
  } catch (error) {
    throw new TerminalValidationError((error as Error).message)
  }
  return { sessionId: requested }
}

export function handleRunnerTerminate(deps: TerminalDeps, payload: unknown): { exited: boolean } {
  const sessionId = readSession(payload)
  try {
    deps.manager.terminate(sessionId)
  } catch (error) {
    throw new TerminalValidationError((error as Error).message)
  }
  return { exited: true }
}

export function handleTerminalWrite(deps: TerminalDeps, payload: unknown): { accepted: boolean } {
  const sessionId = readSession(payload)
  if (!isRecord(payload) || typeof payload['data'] !== 'string') {
    throw new TerminalValidationError("Terminal write requires a string 'data'")
  }
  if (Buffer.byteLength(payload['data'], 'utf8') > MAX_INPUT_BYTES) {
    throw new TerminalValidationError('Terminal write exceeds the 1MB input cap')
  }
  try {
    deps.manager.write(sessionId, payload['data'])
  } catch (error) {
    throw new TerminalValidationError((error as Error).message)
  }
  return { accepted: true }
}

export function handleTerminalResize(deps: TerminalDeps, payload: unknown): { applied: boolean } {
  const sessionId = readSession(payload)
  if (!isRecord(payload)) {
    throw new TerminalValidationError('Terminal request must be an object')
  }
  const cols = readDimension(payload, 'cols', DEFAULT_COLS)
  const rows = readDimension(payload, 'rows', DEFAULT_ROWS)
  try {
    deps.manager.resize(sessionId, cols, rows)
  } catch (error) {
    throw new TerminalValidationError((error as Error).message)
  }
  return { applied: true }
}
