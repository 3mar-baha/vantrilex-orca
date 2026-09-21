import type { ResolvedSpawn } from '../../shared/child-process/spawn-resolution'

export type PtyHandle = {
  pid: number
  write: (data: string) => void
  resize: (cols: number, rows: number) => void
  kill: (signal?: string) => void
  onData: (cb: (chunk: string) => void) => void
  onExit: (cb: (event: { exitCode: number }) => void) => void
}

export type PtySpawnOptions = {
  cwd: string
  cols: number
  rows: number
  env?: NodeJS.ProcessEnv
}

export type PtySpawner = {
  spawn: (file: string, args: readonly string[], opts: PtySpawnOptions) => PtyHandle
}

export type SessionEvent =
  | { type: 'data'; id: string; chunk: string }
  | { type: 'exit'; id: string; code: number }

export type Scheduler = (fn: () => void, ms: number) => void

export class SessionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SessionError'
  }
}

const KILL_GRACE_MS = 2000

export type PtyManagerOptions = {
  killGraceMs?: number
  schedule?: Scheduler
}

type Session = {
  id: string
  pty: PtyHandle
}

export class PtySessionManager {
  private readonly sessions = new Map<string, Session>()
  private nextId = 1
  private readonly killGraceMs: number
  private readonly schedule: Scheduler

  constructor(
    private readonly spawner: PtySpawner,
    private readonly emit: (event: SessionEvent) => void,
    options: PtyManagerOptions = {}
  ) {
    this.killGraceMs = options.killGraceMs ?? KILL_GRACE_MS
    this.schedule =
      options.schedule ??
      ((fn, ms) => {
        setTimeout(fn, ms)
      })
  }

  launch(
    resolved: ResolvedSpawn,
    cwd: string,
    cols: number,
    rows: number
  ): { id: string; pid: number } {
    const id = `session-${this.nextId++}`
    const pty = this.spawner.spawn(resolved.file, resolved.args, {
      cwd,
      cols,
      rows,
      env: (resolved.options.env as NodeJS.ProcessEnv | undefined) ?? process.env
    })
    this.sessions.set(id, { id, pty })
    pty.onData((chunk) => {
      this.emit({ type: 'data', id, chunk })
    })
    pty.onExit(({ exitCode }) => {
      this.sessions.delete(id)
      this.emit({ type: 'exit', id, code: exitCode })
    })
    return { id, pid: pty.pid }
  }

  write(id: string, data: string): void {
    this.session(id).pty.write(data)
  }

  resize(id: string, cols: number, rows: number): void {
    this.session(id).pty.resize(cols, rows)
  }

  terminate(id: string): void {
    const session = this.session(id)
    session.pty.kill()
    this.schedule(() => {
      const pending = this.sessions.get(id)
      if (pending) {
        pending.pty.kill()
        this.sessions.delete(id)
      }
    }, this.killGraceMs)
  }

  count(): number {
    return this.sessions.size
  }

  latestId(): string | null {
    return this.sessions.size === 0 ? null : ([...this.sessions.keys()].at(-1) as string)
  }

  private session(id: string): Session {
    const session = this.sessions.get(id)
    if (!session) {
      throw new SessionError(`Unknown terminal session '${id}'`)
    }
    return session
  }
}
