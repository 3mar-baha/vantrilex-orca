import { describe, expect, it } from 'vitest'
import { PtySessionManager } from '../../src/main/terminal/pty-manager'
import {
  handleRunnerLaunch,
  handleTerminalWrite,
  type TerminalDeps
} from '../../src/main/terminal/terminal-handlers'

function stressDeps(): TerminalDeps {
  const spawner = {
    spawn: () => ({
      pid: 7,
      write: () => {},
      resize: () => {},
      kill: () => {},
      onData: () => {},
      onExit: () => {}
    })
  }
  return {
    manager: new PtySessionManager(spawner, () => {}),
    workspaceExists: () => true,
    platform: 'linux'
  }
}

function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? 0
}

describe('stress-001 concurrent sessions', () => {
  it('keeps 3 sessions alive through a resize storm with p95 input under 100ms', () => {
    const deps = stressDeps()
    const ids = [0, 1, 2].map(
      () => handleRunnerLaunch(deps, { cli: 'claude', workspace: 'O:/repo' }).sessionId
    )
    expect(new Set(ids).size).toBe(3)
    expect(deps.manager.count()).toBe(3)
    const samples: number[] = []
    for (let round = 0; round < 20; round++) {
      for (const [index, id] of ids.entries()) {
        const started = performance.now()
        deps.manager.resize(id, 80 + ((round + index) % 40), 24)
        handleTerminalWrite(deps, { sessionId: id, data: `round-${round}` })
        samples.push(performance.now() - started)
      }
    }
    expect(deps.manager.count()).toBe(3)
    const sorted = [...samples].sort((a, b) => a - b)
    expect(percentile(sorted, 95)).toBeLessThan(100)
  })
})
