import { ipcRenderer } from 'electron'
import type {
  RunnerLaunchRequest,
  RunnerTerminalApi,
  TerminalDataEvent,
  TerminalExitEvent
} from './runner-terminal-api'

function subscribe<T>(channel: string, cb: (event: T) => void): () => void {
  const listener = (_event: unknown, payload: T) => cb(payload)
  ipcRenderer.on(channel, listener as (...args: unknown[]) => void)
  return () => {
    ipcRenderer.removeListener(channel, listener as (...args: unknown[]) => void)
  }
}

export const runnerTerminalApi: RunnerTerminalApi = {
  launch: (request: RunnerLaunchRequest) => ipcRenderer.invoke('runner:launch', request),
  inject: (prompt: string, opts?: { sessionId?: string; workspace?: string; cli?: string }) =>
    ipcRenderer.invoke('runner:inject', { prompt, ...opts }),
  send: (sessionId: string, input: string) =>
    ipcRenderer.invoke('runner:send', { sessionId, data: input }),
  resize: (sessionId: string, cols: number, rows: number) =>
    ipcRenderer.invoke('terminal:resize', { sessionId, cols, rows }),
  terminate: (sessionId: string) => ipcRenderer.invoke('runner:terminate', { sessionId }),
  onData: (cb: (event: TerminalDataEvent) => void) => subscribe('terminal:write', cb),
  onExit: (cb: (event: TerminalExitEvent) => void) => subscribe('terminal:exit', cb)
}
