import type { FetchImpl, KeyringLike } from './tts'

export const BRAIN_MODEL = 'openai/gpt-oss-120b'
const GROQ_CHAT_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

export const GOLDEN_MS = 2000
export const CEILING_MS = 5000

export const AMMANI_SYSTEM_PROMPT =
  'You are the Vantrilex voice brain. Reply in spoken, authentic Ammani Jordanian Arabic only. ' +
  'Never answer in English prose. Code identifiers, file paths, and terminal commands stay in English inline. ' +
  'Keep replies short and spoken: one breath, bottom line first.'

export type BrainReply = {
  reply: string
  ms: number
}

export class LatencyExceededError extends Error {
  readonly ms: number
  constructor(ms: number) {
    super(`Brain exceeded the ${CEILING_MS}ms ceiling at ${ms}ms`)
    this.name = 'LatencyExceededError'
    this.ms = ms
  }
}

export class BrainProviderError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'BrainProviderError'
    this.status = status
  }
}

export type BrainDeps = {
  fetchImpl?: FetchImpl
  keyring: KeyringLike
  now?: () => number
  ceilingMs?: number
}

export class AmmaniBrain {
  private readonly fetchImpl: FetchImpl
  private readonly keyring: KeyringLike
  private readonly now: () => number
  private readonly ceilingMs: number

  constructor(deps: BrainDeps) {
    this.fetchImpl = deps.fetchImpl ?? fetch
    this.keyring = deps.keyring
    this.now = deps.now ?? Date.now
    this.ceilingMs = deps.ceilingMs ?? CEILING_MS
  }

  async think(prompt: string): Promise<BrainReply> {
    if (prompt.trim() === '') {
      throw new BrainProviderError(400, 'Refusing empty prompt')
    }
    const started = this.now()
    const apiKey = this.keyring.checkout('groq')
    let timeout: NodeJS.Timeout | undefined
    try {
      const response = await Promise.race([
        this.fetchImpl(GROQ_CHAT_ENDPOINT, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: BRAIN_MODEL,
            messages: [
              { role: 'system', content: AMMANI_SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ]
          })
        }),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new LatencyExceededError(this.now() - started)),
            this.ceilingMs
          )
        })
      ])
      if (!response.ok) {
        throw new BrainProviderError(
          response.status,
          `Groq rejected completion: ${response.status}`
        )
      }
      const payload = (await response.json()) as { choices?: { message?: { content?: unknown } }[] }
      const reply = payload.choices?.[0]?.message?.content
      if (typeof reply !== 'string' || reply.trim() === '') {
        throw new BrainProviderError(422, 'Brain returned no reply')
      }
      return { reply, ms: this.now() - started }
    } finally {
      clearTimeout(timeout)
    }
  }
}
