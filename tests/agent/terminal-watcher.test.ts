import { describe, expect, it } from 'vitest'
import {
  TerminalWatcher,
  type SessionEvent,
  type TaskConclusion
} from '../../src/main/agent/terminal-watcher'

function manualClock(start = 1_000_000) {
  let now = start
  const scheduled: { at: number; fn: () => void }[] = []
  return {
    now: () => now,
    schedule: (fn: () => void, ms: number) => {
      scheduled.push({ at: now + ms, fn })
    },
    advance: (ms: number) => {
      now += ms
      const due = scheduled.filter((s) => s.at <= now).sort((a, b) => a.at - b.at)
      for (const item of due) {
        scheduled.splice(scheduled.indexOf(item), 1)
        item.fn()
      }
    },
    pending: () => scheduled.length
  }
}

function data(id: string, chunk: string): SessionEvent {
  return { type: 'data', id, chunk }
}

describe('terminal watcher lifecycle', () => {
  it('concludes immediately on session exit with the transcript', () => {
    const conclusions: TaskConclusion[] = []
    const watcher = new TerminalWatcher((c) => conclusions.push(c))
    watcher.observe(data('s-1', 'running tests…\n'))
    watcher.observe(data('s-1', '42 passed\n'))
    watcher.observe({ type: 'exit', id: 's-1', code: 0 })
    expect(conclusions).toHaveLength(1)
    expect(conclusions[0]).toMatchObject({
      sessionId: 's-1',
      transcript: 'running tests…\n42 passed\n',
      exitCode: 0,
      idle: false
    })
  })

  it('concludes on idle stabilization after sustained output', () => {
    const clock = manualClock()
    const conclusions: TaskConclusion[] = []
    const watcher = new TerminalWatcher((c) => conclusions.push(c), {
      idleMs: 5_000,
      now: clock.now,
      schedule: clock.schedule
    })
    watcher.observe(data('s-2', 'building…\n'))
    clock.advance(2_000)
    expect(conclusions).toHaveLength(0)
    watcher.observe(data('s-2', 'done\n'))
    clock.advance(5_000)
    expect(conclusions).toHaveLength(1)
    expect(conclusions[0]).toMatchObject({ sessionId: 's-2', exitCode: null, idle: true })
    expect(conclusions[0]?.transcript).toContain('done')
  })

  it('keeps sessions isolated and bounds transcripts', () => {
    const conclusions: TaskConclusion[] = []
    const watcher = new TerminalWatcher((c) => conclusions.push(c), { maxTranscriptChars: 16 })
    watcher.observe(data('s-1', 'aaaaaaaaaaaaaaaaaaaaaaaa'))
    watcher.observe(data('s-2', 'bb'))
    watcher.observe({ type: 'exit', id: 's-1', code: 1 })
    watcher.observe({ type: 'exit', id: 's-2', code: 0 })
    expect(conclusions).toHaveLength(2)
    expect(conclusions[0]?.transcript).toHaveLength(16)
    expect(conclusions[1]).toMatchObject({ sessionId: 's-2', transcript: 'bb' })
  })

  it('resets a single session buffer without touching others', () => {
    const conclusions: TaskConclusion[] = []
    const watcher = new TerminalWatcher((c) => conclusions.push(c))
    watcher.observe(data('s-1', 'old output\n'))
    watcher.resetSession('s-1')
    expect(watcher.pendingCount()).toBe(0)
    watcher.observe(data('s-1', 'fresh output\n'))
    watcher.observe({ type: 'exit', id: 's-1', code: 0 })
    expect(conclusions).toHaveLength(1)
    expect(conclusions[0]?.transcript).toBe('fresh output\n')
  })

  it('emits conclusions as plain data with no window handles', () => {
    const conclusions: TaskConclusion[] = []
    const watcher = new TerminalWatcher((c) => conclusions.push(c))
    watcher.observe(data('s-9', 'x'))
    watcher.observe({ type: 'exit', id: 's-9', code: 0 })
    expect(conclusions).toHaveLength(1)
    expect(() => JSON.stringify(conclusions[0])).not.toThrow()
    expect(Object.keys(conclusions[0] as object).sort()).toEqual([
      'exitCode',
      'idle',
      'sessionId',
      'transcript'
    ])
  })
})
