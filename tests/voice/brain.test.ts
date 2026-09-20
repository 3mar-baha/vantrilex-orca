import { describe, expect, it, vi } from 'vitest'
import {
  AMMANI_SYSTEM_PROMPT,
  BRAIN_MODEL,
  CEILING_MS,
  GOLDEN_MS,
  AmmaniBrain,
  LatencyExceededError,
  type KeyringLike
} from '../../src/main/voice/brain'

function keyringWith(key: string): KeyringLike {
  return { checkout: () => key }
}

function chatResponse(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 })
}

describe('ammani cognitive brain', () => {
  it('constrains spoken output to ammani arabic', () => {
    expect(AMMANI_SYSTEM_PROMPT).toMatch(/Ammani/)
    expect(AMMANI_SYSTEM_PROMPT).toMatch(/Arabic/)
  })

  it('calls the oss-120b model with the system contract', async () => {
    const fetchImpl = vi.fn(async () => chatResponse('ahlan'))
    const brain = new AmmaniBrain({ fetchImpl, keyring: keyringWith('k') })
    const result = await brain.think('status?')
    expect(result.reply).toBe('ahlan')
    const init = fetchImpl.mock.calls[0][1] as { body: string }
    const payload = JSON.parse(init.body) as {
      model: string
      messages: { role: string; content: string }[]
    }
    expect(payload.model).toBe(BRAIN_MODEL)
    expect(payload.messages[0]).toMatchObject({ role: 'system', content: AMMANI_SYSTEM_PROMPT })
  })

  it('measures inside the golden budget for fast providers', async () => {
    let now = 1000
    const fetchImpl = vi.fn(async () => {
      now = 1400
      return chatResponse('ahlan')
    })
    const brain = new AmmaniBrain({ fetchImpl, keyring: keyringWith('k'), now: () => now })
    const result = await brain.think('status?')
    expect(result.ms).toBe(400)
    expect(result.ms).toBeLessThanOrEqual(GOLDEN_MS)
  })

  it('aborts with a typed error past the ceiling', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Promise<Response>((resolve) => setTimeout(() => resolve(chatResponse('late')), 50))
    )
    const brain = new AmmaniBrain({ fetchImpl, keyring: keyringWith('k'), ceilingMs: 5 })
    await expect(brain.think('status?')).rejects.toThrow(LatencyExceededError)
    expect(CEILING_MS).toBe(5000)
  })
})
