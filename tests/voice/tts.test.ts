import { describe, expect, it, vi } from 'vitest'
import {
  FISH_FEMALE_REF,
  FISH_MALE_REF,
  FISH_MODEL,
  FishTts,
  TtsProviderError,
  type KeyringLike
} from '../../src/main/voice/tts'

function keyringWith(key: string): KeyringLike {
  return { checkout: () => key }
}

function okAudio(bytes: number[] = [0x49, 0x44, 0x33]): Response {
  return new Response(new Uint8Array(bytes), { status: 200 })
}

describe('fish tts client', () => {
  it('uses the male voice reference by default', async () => {
    const fetchImpl = vi.fn(async () => okAudio())
    const tts = new FishTts({ fetchImpl, keyring: keyringWith('k') })
    const clip = await tts.speak('marhaba')
    expect(clip.voice).toBe('male')
    expect(clip.cached).toBe(false)
    const init = fetchImpl.mock.calls[0][1] as { body: string; headers: Record<string, string> }
    const payload = JSON.parse(init.body) as { model: string; reference_id: string; input: string }
    expect(payload.reference_id).toBe(FISH_MALE_REF)
    expect(payload.model).toBe(FISH_MODEL)
    expect(payload.input).toBe('marhaba')
    expect(init.headers.authorization).toBe('Bearer k')
  })

  it('uses the female voice reference on toggle', async () => {
    const fetchImpl = vi.fn(async () => okAudio())
    const tts = new FishTts({ fetchImpl, keyring: keyringWith('k') })
    const clip = await tts.speak('marhaba', 'female')
    expect(clip.voice).toBe('female')
    const init = fetchImpl.mock.calls[0][1] as { body: string }
    const payload = JSON.parse(init.body) as { reference_id: string }
    expect(payload.reference_id).toBe(FISH_FEMALE_REF)
  })

  it('serves repeat utterances from the LRU cache without fetch', async () => {
    const fetchImpl = vi.fn(async () => okAudio())
    const tts = new FishTts({ fetchImpl, keyring: keyringWith('k') })
    await tts.speak('marhaba')
    const second = await tts.speak('marhaba')
    expect(second.cached).toBe(true)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('evicts the oldest entry past capacity', async () => {
    const fetchImpl = vi.fn(async () => okAudio())
    const tts = new FishTts({ fetchImpl, keyring: keyringWith('k'), cacheSize: 2 })
    await tts.speak('one')
    await tts.speak('two')
    await tts.speak('three')
    await tts.speak('one')
    expect(fetchImpl).toHaveBeenCalledTimes(4)
  })

  it('raises a typed provider error on non-200 responses', async () => {
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 429 }))
    const tts = new FishTts({ fetchImpl, keyring: keyringWith('k') })
    await expect(tts.speak('marhaba')).rejects.toThrow(TtsProviderError)
  })

  it('rejects empty text at the boundary', async () => {
    const fetchImpl = vi.fn(async () => okAudio())
    const tts = new FishTts({ fetchImpl, keyring: keyringWith('k') })
    await expect(tts.speak('   ')).rejects.toThrow()
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
