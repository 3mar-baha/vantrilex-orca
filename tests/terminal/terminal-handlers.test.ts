import { describe, expect, it } from 'vitest'
import {
  TerminalValidationError,
  handleRunnerLaunch,
  handleRunnerTerminate,
  handleTerminalResize,
  handleTerminalWrite,
  type TerminalDeps
} from '../../src/main/terminal/terminal-handlers'
import { PtySessionManager } from '../../src/main/terminal/pty-manager'

function depsWithFakePty(): TerminalDeps {
  const spawned: { file: string; args: readonly string[] }[] = []
  const spawner = {
    spawn: (file: string, args: readonly string[]) => {
      spawned.push({ file, args })
      return {
        pid: 4242,
        write: () => {},
        resize: () => {},
        kill: () => {},
        onData: () => {},
        onExit: () => {}
      }
    }
  }
  const manager = new PtySessionManager(spawner, () => {})
  return { manager, workspaceExists: () => true, platform: 'linux' }
}

describe('terminal ipc handlers', () => {
  it('launches runners through argv and spawn resolution', () => {
    const result = handleRunnerLaunch(depsWithFakePty(), {
      cli: 'claude',
      workspace: 'O:/repo',
      cols: 80,
      rows: 24
    })
    expect(result.sessionId).toBe('session-1')
    expect(result.pid).toBe(4242)
  })

  it('rejects unknown clis, bad workspaces, and bad geometry', () => {
    const deps = depsWithFakePty()
    expect(() => handleRunnerLaunch(deps, { cli: 'evil', workspace: 'O:/repo' })).toThrow(
      TerminalValidationError
    )
    expect(() =>
      handleRunnerLaunch(
        { ...deps, workspaceExists: () => false },
        { cli: 'claude', workspace: 'O:/nope' }
      )
    ).toThrow(TerminalValidationError)
    expect(() =>
      handleRunnerLaunch(deps, { cli: 'claude', workspace: 'O:/repo', cols: 0, rows: 24 })
    ).toThrow(TerminalValidationError)
    expect(() =>
      handleRunnerLaunch(deps, { cli: 'claude', workspace: 'O:/repo', cols: 80, rows: 5000 })
    ).toThrow(TerminalValidationError)
  })

  it('writes, resizes, and terminates known sessions', () => {
    const deps = depsWithFakePty()
    const launched = handleRunnerLaunch(deps, { cli: 'codex', workspace: 'O:/repo' })
    expect(handleTerminalWrite(deps, { sessionId: launched.sessionId, data: 'hi' })).toEqual({
      accepted: true
    })
    expect(
      handleTerminalResize(deps, { sessionId: launched.sessionId, cols: 100, rows: 30 })
    ).toEqual({
      applied: true
    })
    expect(handleRunnerTerminate(deps, { sessionId: launched.sessionId })).toEqual({ exited: true })
  })

  it('rejects oversized input and unknown sessions', () => {
    const deps = depsWithFakePty()
    expect(() => handleTerminalWrite(deps, { sessionId: 'nope', data: 'x' })).toThrow(
      TerminalValidationError
    )
    expect(() =>
      handleTerminalWrite(deps, { sessionId: 'nope', data: 'x'.repeat(2 * 1024 * 1024) })
    ).toThrow(TerminalValidationError)
    expect(() => handleRunnerTerminate(deps, { sessionId: '' })).toThrow(TerminalValidationError)
  })
})
