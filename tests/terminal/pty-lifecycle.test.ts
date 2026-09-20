import { describe, expect, it } from 'vitest'
import {
  PtySessionManager,
  SessionError,
  type PtyHandle,
  type PtySpawner
} from '../../src/main/terminal/pty-manager'

type FakePty = PtyHandle & {
  written: string[]
  resized: { cols: number; rows: number }[]
  kills: number
  fireData: (chunk: string) => void
  fireExit: (code: number) => void
}

function fakeSpawner(): PtySpawner & { instances: FakePty[]; nextPid: { value: number } } {
  const instances: FakePty[] = []
  const nextPid = { value: 1000 }
  return {
    instances,
    nextPid,
    spawn: (file, args, opts) => {
      void file
      void args
      void opts
      const dataCbs: ((chunk: string) => void)[] = []
      const exitCbs: ((e: { exitCode: number }) => void)[] = []
      const fake: FakePty = {
        pid: nextPid.value++,
        written: [],
        resized: [],
        kills: 0,
        fireData: (chunk) => dataCbs.forEach((cb) => cb(chunk)),
        fireExit: (code) => exitCbs.forEach((cb) => cb({ exitCode: code })),
        write: (data) => {
          fake.written.push(data)
        },
        resize: (cols, rows) => {
          fake.resized.push({ cols, rows })
        },
        kill: () => {
          fake.kills += 1
        },
        onData: (cb) => dataCbs.push(cb),
        onExit: (cb) => exitCbs.push(cb)
      }
      instances.push(fake)
      return fake
    }
  }
}

function manualScheduler() {
  const queued: (() => void)[] = []
  return {
    schedule: (fn: () => void) => {
      queued.push(fn)
    },
    runAll: () => {
      while (queued.length > 0) {
        queued.shift()?.()
      }
    },
    pending: () => queued.length
  }
}

const RESOLVED = {
  file: 'claude',
  args: [] as readonly string[],
  options: { windowsHide: true as const, shell: false as const }
}

describe('pty session lifecycle', () => {
  it('launches sessions with incrementing ids and tracks count', () => {
    const spawner = fakeSpawner()
    const events: unknown[] = []
    const manager = new PtySessionManager(spawner, (e) => events.push(e))
    const first = manager.launch(RESOLVED, 'O:/repo', 80, 24)
    const second = manager.launch(RESOLVED, 'O:/repo', 80, 24)
    expect(first.id).not.toBe(second.id)
    expect(manager.count()).toBe(2)
    expect(first.pid).toBe(1000)
  })

  it('routes writes and resizes to the owning pty', () => {
    const spawner = fakeSpawner()
    const manager = new PtySessionManager(spawner, () => {})
    const session = manager.launch(RESOLVED, 'O:/repo', 80, 24)
    manager.write(session.id, 'hello')
    manager.resize(session.id, 100, 30)
    expect(spawner.instances[0]?.written).toEqual(['hello'])
    expect(spawner.instances[0]?.resized).toEqual([{ cols: 100, rows: 30 }])
  })

  it('rejects unknown session ids with a typed error', () => {
    const manager = new PtySessionManager(fakeSpawner(), () => {})
    expect(() => manager.write('missing', 'x')).toThrow(SessionError)
    expect(() => manager.resize('missing', 80, 24)).toThrow(SessionError)
    expect(() => manager.terminate('missing')).toThrow(SessionError)
  })

  it('forwards pty data and reaps sessions on exit', () => {
    const spawner = fakeSpawner()
    const events: { type: string; id: string }[] = []
    const manager = new PtySessionManager(spawner, (e) =>
      events.push(e as { type: string; id: string })
    )
    const session = manager.launch(RESOLVED, 'O:/repo', 80, 24)
    spawner.instances[0]?.fireData('out')
    spawner.instances[0]?.fireExit(0)
    expect(events.map((e) => e.type)).toEqual(['data', 'exit'])
    expect(events.map((e) => e.id)).toEqual([session.id, session.id])
    expect(manager.count()).toBe(0)
  })

  it('kills gracefully then force-reaps after the grace window', () => {
    const spawner = fakeSpawner()
    const clock = manualScheduler()
    const manager = new PtySessionManager(spawner, () => {}, { schedule: clock.schedule })
    const session = manager.launch(RESOLVED, 'O:/repo', 80, 24)
    manager.terminate(session.id)
    expect(spawner.instances[0]?.kills).toBe(1)
    expect(clock.pending()).toBe(1)
    clock.runAll()
    expect(spawner.instances[0]?.kills).toBe(2)
    expect(manager.count()).toBe(0)
  })

  it('skips the force sweep when the session already exited', () => {
    const spawner = fakeSpawner()
    const clock = manualScheduler()
    const manager = new PtySessionManager(spawner, () => {}, { schedule: clock.schedule })
    const session = manager.launch(RESOLVED, 'O:/repo', 80, 24)
    manager.terminate(session.id)
    spawner.instances[0]?.fireExit(0)
    clock.runAll()
    expect(spawner.instances[0]?.kills).toBe(1)
    expect(manager.count()).toBe(0)
  })
})
