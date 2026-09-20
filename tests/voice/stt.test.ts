import { describe, expect, it, vi } from 'vitest'
import {
  GroqStt,
  SttProviderError,
  WHISPER_MODEL,
  type KeyringLike
} from '../../src/main/voice/stt'

function keyringWith(key: string): KeyringLike {
  return { checkout: () => key }
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status })
}

describe('groq whisper stt client', () => {
  it('sends the turbo model with the audio file', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ text: 'marhaba' }))
    const stt = new GroqStt({ fetchImpl, keyring: keyringWith('k') })
    const result = await stt.transcribe(new Uint8Array([1, 2, 3]))
    expect(result.text).toBe('marhaba')
    const form = fetchImpl.mock.calls[0][1].body as FormData
    expect(form.get('model')).toBe(WHISPER_MODEL)
    expect(form.get('file')).toBeInstanceOf(Blob)
  })

  it('normalizes verbose json payloads to plain text', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ text: '  ahlan wa sahlan  ', segments: [{ text: 'ahlan' }] })
    )
    const stt = new GroqStt({ fetchImpl, keyring: keyringWith('k') })
    const result = await stt.transcribe(new Uint8Array([1]))
    expect(result.text).toBe('ahlan wa sahlan')
  })

  it('raises a typed error on empty transcripts', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ text: '   ' }))
    const stt = new GroqStt({ fetchImpl, keyring: keyringWith('k') })
    await expect(stt.transcribe(new Uint8Array([1]))).rejects.toThrow()
  })

  it('raises a typed provider error on non-200 responses', async () => {
    const fetchImpl = vi.fn(async () => new Response('bad', { status: 401 }))
    const stt = new GroqStt({ fetchImpl, keyring: keyringWith('k') })
    await expect(stt.transcribe(new Uint8Array([1]))).rejects.toThrow(SttProviderError)
  })
})
