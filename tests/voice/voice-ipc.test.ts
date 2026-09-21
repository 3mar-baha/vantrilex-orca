import { describe, expect, it, vi } from 'vitest'
import {
  VoiceValidationError,
  createVoiceService,
  registerVoiceIpc,
  type IpcHandleSeed,
  type VoiceService
} from '../../src/main/voice/voice-ipc'

function fakeService(): VoiceService & { calls: string[] } {
  const calls: string[] = []
  return {
    calls,
    transcribe: async (audio: Uint8Array) => {
      calls.push(`transcribe:${audio.length}`)
      return { text: 'marhaba', ms: 1 }
    },
    think: async (prompt: string) => {
      calls.push(`think:${prompt}`)
      return { reply: 'ahlan', ms: 2 }
    },
    speak: async (text: string, voice) => {
      calls.push(`speak:${voice}:${text}`)
      return { audio: new Uint8Array([1]), voice, ms: 3 }
    }
  }
}

function captor() {
  const handlers = new Map<string, (event: unknown, ...args: unknown[]) => unknown>()
  const ipc: IpcHandleSeed = {
    handle: (channel, listener) => {
      handlers.set(channel, listener)
    }
  }
  return { ipc, handlers }
}

describe('voice ipc', () => {
  it('routes transcribe/think/speak through the service', async () => {
    const service = fakeService()
    const { ipc, handlers } = captor()
    registerVoiceIpc(ipc, service)
    expect([...handlers.keys()].sort()).toEqual(['voice:speak', 'voice:think', 'voice:transcribe'])
    await expect(handlers.get('voice:transcribe')?.({}, { audio: [1, 2] })).resolves.toMatchObject({
      text: 'marhaba'
    })
    await expect(handlers.get('voice:think')?.({}, { prompt: 'hi' })).resolves.toMatchObject({
      reply: 'ahlan'
    })
    await expect(
      handlers.get('voice:speak')?.({}, { text: 'ahlan', voice: 'female' })
    ).resolves.toMatchObject({ voice: 'female' })
    expect(service.calls).toEqual(['transcribe:2', 'think:hi', 'speak:female:ahlan'])
  })

  it('rejects empty audio, blank text, and unknown voices', async () => {
    const service = fakeService()
    const { handlers } = captor()
    registerVoiceIpc({ handle: (c, l) => handlers.set(c, l) }, service)
    await expect(handlers.get('voice:transcribe')?.({}, { audio: [] })).rejects.toThrow(
      VoiceValidationError
    )
    await expect(handlers.get('voice:think')?.({}, { prompt: '  ' })).rejects.toThrow(
      VoiceValidationError
    )
    await expect(handlers.get('voice:speak')?.({}, { text: 'x', voice: 'robot' })).rejects.toThrow(
      VoiceValidationError
    )
    expect(service.calls).toEqual([])
  })

  it('delegates creation to the provisioned modules', async () => {
    const tts = { speak: vi.fn(async () => ({ audio: new Uint8Array([9]), voice: 'male', ms: 1 })) }
    const stt = { transcribe: vi.fn(async () => ({ text: 't', ms: 1 })) }
    const brain = { think: vi.fn(async () => ({ reply: 'r', ms: 1 })) }
    const service = createVoiceService({ tts, stt, brain } as never)
    await service.transcribe(new Uint8Array([1]))
    await service.think('p')
    await service.speak('s', 'male')
    expect(stt.transcribe).toHaveBeenCalledTimes(1)
    expect(brain.think).toHaveBeenCalledTimes(1)
    expect(tts.speak).toHaveBeenCalledTimes(1)
  })
})
