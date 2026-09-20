import { describe, expect, it } from 'vitest'
import {
  ToolError,
  listWorktrees,
  summarizeDiff,
  type ExecFn
} from '../../src/main/voice/orca-tools'

function fakeExec(responses: Record<string, { stdout: string; code: number }>): ExecFn {
  return async (argv) => responses[argv.join(' ')] ?? { stdout: '', code: 1 }
}

describe('orca control tools', () => {
  it('lists worktree paths from porcelain output', async () => {
    const exec = fakeExec({
      'git worktree list --porcelain': {
        stdout:
          'worktree O:/repo/main\nHEAD abc\nbranch refs/heads/main\n\nworktree O:/repo/feat\nHEAD def\nbranch refs/heads/feat\n',
        code: 0
      }
    })
    await expect(listWorktrees(exec, 'O:/repo/main')).resolves.toEqual([
      'O:/repo/main',
      'O:/repo/feat'
    ])
  })

  it('summarizes numstat diffs and skips binary entries', async () => {
    const exec = fakeExec({
      'git diff --numstat': {
        stdout: '10\t4\tsrc/a.ts\n-\t-\tassets/logo.png\n2\t2\tsrc/b.ts\n',
        code: 0
      }
    })
    await expect(summarizeDiff(exec, 'O:/repo/main')).resolves.toEqual({
      files: ['src/a.ts', 'assets/logo.png', 'src/b.ts'],
      insertions: 12,
      deletions: 6
    })
  })

  it('raises a typed error with the exit code on failure', async () => {
    const exec = fakeExec({})
    const error = await listWorktrees(exec, 'O:/repo/main').catch((e) => e)
    expect(error).toBeInstanceOf(ToolError)
    expect((error as ToolError).code).toBe(1)
  })
})
