import * as pty from 'node-pty'
import {
  handleRunnerLaunch,
  handleRunnerTerminate,
  handleTerminalResize,
  handleTerminalWrite,
  type TerminalDeps
} from './terminal-handlers'
import { PtySessionManager, type SessionEvent } from './pty-manager'

export type IpcHandleSeed = {
  handle: (channel: string, listener: (event: unknown, ...args: unknown[]) => unknown) => void
}

export function createTerminalManager(
  emit: (event: SessionEvent) => void,
  workspaceExists: (path: string) => boolean
): TerminalDeps {
  const manager = new PtySessionManager(
    {
      spawn: (file, args, opts) =>
        pty.spawn(file, [...args], {
          cwd: opts.cwd,
          cols: opts.cols,
          rows: opts.rows,
          env: (opts.env ?? process.env) as Record<string, string>
        })
    },
    emit
  )
  return { manager, workspaceExists }
}

export function registerTerminalIpc(ipc: IpcHandleSeed, deps: TerminalDeps): void {
  ipc.handle('runner:launch', (_event, payload: unknown) => handleRunnerLaunch(deps, payload))
  ipc.handle('runner:terminate', (_event, payload: unknown) => handleRunnerTerminate(deps, payload))
  ipc.handle('runner:send', (_event, payload: unknown) => handleTerminalWrite(deps, payload))
  ipc.handle('terminal:resize', (_event, payload: unknown) => handleTerminalResize(deps, payload))
}
