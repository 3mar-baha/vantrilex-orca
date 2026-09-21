import { describe, expect, it, vi } from 'vitest'
import { briefConclusion, type BriefingDeps } from '../../src/main/agent/briefing'
import type { TaskConclusion } from '../../src/main/agent/terminal-watcher'

function conclusion(): TaskConclusion {
  return { sessionId: 's-1', transcript: '42 passed, 0 failed\n', exitCode: 0, idle: false }
}

function deps(): BriefingDeps & { spoken: { reply: string; audio: number[] }[] } {
  const spoken: { reply: string; audio: number[] }[] = []
  return {
    spoken,
    brain: { think: async () => ({ reply: 'done', ms: 1 }) },
    tts: {
      speak: async (text: string, voice: 'male' | 'female') => {
        spoken.push({ reply: `${voice}:${text}`, audio: [7] })
        return { audio: new Uint8Array([7]), voice, ms: 1 }
      }
    }
  }
}

describe('spoken completion briefing', () => {
  it('summarizes through the brain and speaks the reply', async () => {
    const d = deps()
    const think = vi.spyOn(d.brain, 'think')
    const result = await briefConclusion(d, conclusion(), { armed: true, voice: 'female' })
    expect(think).toHaveBeenCalledOnce()
    expect(String(think.mock.calls[0]?.[0])).toContain('42 passed')
    expect(result).toMatchObject({ spoken: true })
    expect(d.spoken).toHaveLength(1)
    expect(d.spoken[0]?.reply).toMatch(/^female:/)
  })

  it('stays silent when muted without calling brain or tts', async () => {
    const d = deps()
    const think = vi.spyOn(d.brain, 'think')
    const result = await briefConclusion(d, conclusion(), { armed: false, voice: 'male' })
    expect(result).toMatchObject({ spoken: false })
    expect(think).not.toHaveBeenCalled()
    expect(d.spoken).toHaveLength(0)
  })

  it('never throws the watcher loop on brain failure', async () => {
    const d = deps()
    d.brain.think = async () => {
      throw new Error('provider down')
    }
    const result = await briefConclusion(d, conclusion(), { armed: true, voice: 'male' })
    expect(result).toMatchObject({ spoken: false })
  })
})
