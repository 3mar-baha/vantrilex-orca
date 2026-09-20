import { describe, expect, it } from 'vitest'
import { ArgvError, buildRunnerArgv } from '../../src/main/terminal/argv-builder'

describe('runner argv builder', () => {
  it('builds deterministic argv per cli with workspace cwd contract', () => {
    expect(buildRunnerArgv({ cli: 'claude', workspace: 'O:/repo' })).toEqual({
      program: 'claude',
      args: []
    })
    expect(buildRunnerArgv({ cli: 'opencode', workspace: 'O:/repo' })).toEqual({
      program: 'opencode',
      args: []
    })
    expect(buildRunnerArgv({ cli: 'codex', workspace: 'O:/repo' })).toEqual({
      program: 'codex',
      args: []
    })
  })

  it('maps resume to the per-cli continue flag', () => {
    expect(buildRunnerArgv({ cli: 'claude', workspace: 'O:/repo', resume: true }).args).toEqual([
      '--continue'
    ])
    expect(buildRunnerArgv({ cli: 'opencode', workspace: 'O:/repo', resume: true }).args).toEqual([
      '--continue'
    ])
    expect(buildRunnerArgv({ cli: 'codex', workspace: 'O:/repo', resume: true }).args).toEqual([
      '--resume'
    ])
  })

  it('accepts allow-listed extra flags in order', () => {
    const built = buildRunnerArgv({
      cli: 'claude',
      workspace: 'O:/repo',
      resume: true,
      extraFlags: ['--verbose']
    })
    expect(built.args).toEqual(['--continue', '--verbose'])
  })

  it('rejects unknown clis and illegal flags', () => {
    expect(() => buildRunnerArgv({ cli: 'evil', workspace: 'O:/repo' })).toThrow(ArgvError)
    expect(() =>
      buildRunnerArgv({ cli: 'claude', workspace: 'O:/repo', extraFlags: ['--exec'] })
    ).toThrow(ArgvError)
    expect(() =>
      buildRunnerArgv({ cli: 'claude', workspace: 'O:/repo', extraFlags: ['rm -rf'] })
    ).toThrow(ArgvError)
    expect(() => buildRunnerArgv({ cli: 'claude', workspace: '   ', extraFlags: [] })).toThrow(
      ArgvError
    )
  })
})
