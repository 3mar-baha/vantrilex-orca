import type { SessionEvent } from '../terminal/pty-manager'

export type { SessionEvent }

export type TaskConclusion = {
  sessionId: string
  transcript: string
  exitCode: number | null
  idle: boolean
}

export type WatcherScheduler = (fn: () => void, ms: number) => void

export type WatcherOptions = {
  idleMs?: number
  maxTranscriptChars?: number
  now?: () => number
  schedule?: WatcherScheduler
}

const DEFAULT_IDLE_MS = 15_000
const DEFAULT_MAX_TRANSCRIPT_CHARS = 32_768

type SessionBuffer = {
  transcript: string
  lastActivityAt: number
  concluded: boolean
  idleGeneration: number
}

export class TerminalWatcher {
  private readonly sessions = new Map<string, SessionBuffer>()
  private readonly idleMs: number
  private readonly maxTranscriptChars: number
  private readonly now: () => number
  private readonly schedule: WatcherScheduler

  constructor(
    private readonly onConclusion: (conclusion: TaskConclusion) => void,
    options: WatcherOptions = {}
  ) {
    this.idleMs = options.idleMs ?? DEFAULT_IDLE_MS
    this.maxTranscriptChars = options.maxTranscriptChars ?? DEFAULT_MAX_TRANSCRIPT_CHARS
    this.now = options.now ?? Date.now
    this.schedule =
      options.schedule ??
      ((fn, ms) => {
        setTimeout(fn, ms)
      })
  }

  resetSession(id: string): void {
    this.sessions.delete(id)
  }

  pendingCount(): number {
    return this.sessions.size
  }

  observe(event: SessionEvent): void {
    if (event.type === 'exit') {
      const buffer = this.sessions.get(event.id)
      this.sessions.delete(event.id)
      this.onConclusion({
        sessionId: event.id,
        transcript: buffer?.transcript ?? '',
        exitCode: event.code,
        idle: false
      })
      return
    }
    let buffer = this.sessions.get(event.id)
    if (!buffer) {
      buffer = {
        transcript: '',
        lastActivityAt: this.now(),
        concluded: false,
        idleGeneration: 0
      }
      this.sessions.set(event.id, buffer)
    }
    buffer.transcript = (buffer.transcript + event.chunk).slice(-this.maxTranscriptChars)
    buffer.lastActivityAt = this.now()
    buffer.idleGeneration += 1
    const generation = buffer.idleGeneration
    this.schedule(() => this.checkIdle(event.id, generation), this.idleMs)
  }

  private checkIdle(id: string, generation: number): void {
    const buffer = this.sessions.get(id)
    if (!buffer || buffer.concluded || buffer.idleGeneration !== generation) {
      return
    }
    if (this.now() - buffer.lastActivityAt < this.idleMs) {
      return
    }
    buffer.concluded = true
    this.sessions.delete(id)
    this.onConclusion({ sessionId: id, transcript: buffer.transcript, exitCode: null, idle: true })
  }
}
