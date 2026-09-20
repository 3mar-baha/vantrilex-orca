export type RunnerLaunchRequest = {
  cli: string
  workspace: string
  cols?: number
  rows?: number
  resume?: boolean
  extraFlags?: string[]
}

export type RunnerLaunchResult = {
  sessionId: string
  pid: number
}

export type TerminalExitEvent = {
  sessionId: string
  code: number
}

export type TerminalDataEvent = {
  sessionId: string
  chunk: string
}

export type RunnerTerminalApi = {
  launch: (request: RunnerLaunchRequest) => Promise<RunnerLaunchResult>
  send: (sessionId: string, input: string) => Promise<{ accepted: boolean }>
  resize: (sessionId: string, cols: number, rows: number) => Promise<{ applied: boolean }>
  terminate: (sessionId: string) => Promise<{ exited: boolean }>
  onData: (cb: (event: TerminalDataEvent) => void) => () => void
  onExit: (cb: (event: TerminalExitEvent) => void) => () => void
}
