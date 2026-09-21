import { describe, expect, it, vi } from 'vitest'
import {
  OrchestratorError,
  buildEngineeringPrompt,
  orchestrateDirective
} from '../../src/main/agent/prompt-orchestrator'

const state = {
  checkpoint: 'Plan STEP9 done. Next: voice loop.',
  roadmap: 'Step 4 voice, Step 5 terminal.',
  diff: 'M src/main/voice/tts.ts (+12)'
}

describe('prompt orchestrator', () => {
  it('engineers a Template-M prompt from intent plus project state', () => {
    const prompt = buildEngineeringPrompt('continue the work', state)
    expect(prompt).toContain('continue the work')
    expect(prompt).toContain('Plan STEP9 done')
    expect(prompt).toContain('Step 4 voice')
    expect(prompt).toContain('M src/main/voice/tts.ts')
    expect(prompt).toContain('Template-M')
  })

  it('dispatches the engineered prompt and re-arms the watcher', async () => {
    const injected: string[] = []
    const rearmed: string[] = []
    const brain = {
      think: vi.fn(async (prompt: string) => ({ reply: `ENGINEERED:${prompt.length}`, ms: 1 }))
    }
    const result = await orchestrateDirective(
      {
        brain,
        readProjectState: async () => state,
        inject: async (prompt: string) => {
          injected.push(prompt)
          return { sessionId: 'session-3' }
        },
        rearm: (sessionId: string) => {
          rearmed.push(sessionId)
        }
      },
      'keep going',
      'O:/repo'
    )
    expect(brain.think).toHaveBeenCalledOnce()
    expect(String(brain.think.mock.calls[0]?.[0])).toContain('keep going')
    expect(injected).toHaveLength(1)
    expect(injected[0]).toContain('ENGINEERED:')
    expect(result).toMatchObject({ sessionId: 'session-3' })
    expect(rearmed).toEqual(['session-3'])
  })

  it('fails typed without injecting when state is unreadable', async () => {
    const inject = vi.fn()
    await expect(
      orchestrateDirective(
        {
          brain: { think: async () => ({ reply: 'x', ms: 1 }) },
          readProjectState: async () => {
            throw new Error('no repo')
          },
          inject,
          rearm: () => {}
        },
        'go',
        'O:/missing'
      )
    ).rejects.toThrow(OrchestratorError)
    expect(inject).not.toHaveBeenCalled()
  })

  it('rejects blank directives at the boundary', async () => {
    await expect(
      orchestrateDirective(
        {
          brain: { think: async () => ({ reply: 'x', ms: 1 }) },
          readProjectState: async () => state,
          inject: async () => ({ sessionId: 's' }),
          rearm: () => {}
        },
        '   ',
        'O:/repo'
      )
    ).rejects.toThrow(OrchestratorError)
  })
})
