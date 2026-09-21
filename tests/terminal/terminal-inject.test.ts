import { describe, expect, it } from 'vitest'
import { PtySessionManager } from '../../src/main/terminal/pty-manager'
import {
  TerminalValidationError,
  handleRunnerInject,
  type TerminalDeps
} from '../../src/main/terminal/terminal-handlers'

function depsWithSessions(count: number): { deps: TerminalDeps; written: string[][] } {
  const written: string[][] = []
  const instances: { write: (data: string) => void }[] = []
  for (let i = 0; i < count; i++) {
    const slot: string[] = []
    written.push(slot)
    instances.push({ write: (data: string) => slot.push(data) })
  }
  let next = 0
  const spawner = {
    spawn: () => {
      const own = instances[next++] as {
        write: (data: string) => void
        resize: () => void
        kill: () => void
        onData: () => void
        onExit: () => void
      }
      return {
        pid: 1,
        ...own,
        resize: () => {},
        kill: () => {},
        onData: () => {},
        onExit: () => {}
      }
    }
  }
  const deps: TerminalDeps = {
    manager: new PtySessionManager(spawner, () => {}),
    workspaceExists: () => true,
    platform: 'linux'
  }
  return { deps, written }
}

const PROMPT = 'Generate docs/showcase.html'

describe('runner prompt injection', () => {
  it('writes to the newest alive session with a submit newline', () => {
    const { deps, written } = depsWithSessions(2)
    deps.manager.launch({ file: 'x', args: [], options: {} }, 'O:/repo', 80, 24)
    deps.manager.launch({ file: 'x', args: [], options: {} }, 'O:/repo', 80, 24)
    const result = handleRunnerInject(deps, { prompt: PROMPT })
    expect(result.sessionId).toBe('session-2')
    expect(written[1]).toEqual([`${PROMPT}\n`])
    expect(written[0]).toEqual([])
  })

  it('targets an explicit session and rejects blank prompts', () => {
    const { deps, written } = depsWithSessions(1)
    deps.manager.launch({ file: 'x', args: [], options: {} }, 'O:/repo', 80, 24)
    expect(handleRunnerInject(deps, { prompt: PROMPT, sessionId: 'session-1' })).toMatchObject({
      sessionId: 'session-1'
    })
    expect(written[0]).toEqual([`${PROMPT}\n`])
    expect(() => handleRunnerInject(deps, { prompt: '   ' })).toThrow(TerminalValidationError)
  })

  it('reports no active session instead of writing nowhere', () => {
    const { deps } = depsWithSessions(0)
    expect(() => handleRunnerInject(deps, { prompt: PROMPT })).toThrow(TerminalValidationError)
    expect(() => handleRunnerInject(deps, { prompt: PROMPT, sessionId: 'ghost' })).toThrow(
      TerminalValidationError
    )
  })

  it('auto-spawns a default runner when a workspace is provided', () => {
    const written: string[][] = []
    const spawner = {
      spawn: () => {
        const slot: string[] = []
        written.push(slot)
        return {
          pid: 7,
          write: (data: string) => slot.push(data),
          resize: () => {},
          kill: () => {},
          onData: () => {},
          onExit: () => {}
        }
      }
    }
    const deps: TerminalDeps = {
      manager: new PtySessionManager(spawner, () => {}),
      workspaceExists: () => true,
      platform: 'linux'
    }
    const result = handleRunnerInject(deps, { prompt: PROMPT, workspace: 'O:/repo' })
    expect(result).toMatchObject({ sessionId: 'session-1', spawned: true })
    expect(written).toEqual([[`${PROMPT}\n`]])
  })

  it('still fails without a workspace to spawn from', () => {
    const { deps } = depsWithSessions(0)
    expect(() => handleRunnerInject(deps, { prompt: PROMPT, workspace: '   ' })).toThrow(
      TerminalValidationError
    )
    expect(() => handleRunnerInject(deps, { prompt: PROMPT, cli: 'evil' })).toThrow(
      TerminalValidationError
    )
  })
})
