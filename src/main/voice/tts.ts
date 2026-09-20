import type { KeyPoolName } from './keyring'

export const FISH_MODEL = 's2.1-pro-free'
export const FISH_MALE_REF = '5b90451e0cd34b2788841744af7c55c3'
export const FISH_FEMALE_REF = '88c0375e46fa4e3b929755fa077ca5ad'
const FISH_ENDPOINT = 'https://api.fish.audio/v1/tts'

export type VoiceChoice = 'male' | 'female'

export type SpeechClip = {
  audio: Uint8Array
  voice: VoiceChoice
  cached: boolean
  ms: number
}

export type KeyringLike = {
  checkout: (pool: KeyPoolName) => string
}

export type FetchImpl = (url: string, init: RequestInit) => Promise<Response>

export class TtsProviderError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'TtsProviderError'
    this.status = status
  }
}

export type TtsDeps = {
  fetchImpl?: FetchImpl
  keyring: KeyringLike
  now?: () => number
  cacheSize?: number
}

const DEFAULT_CACHE_SIZE = 50

export class FishTts {
  private readonly cache = new Map<string, Uint8Array>()
  private readonly fetchImpl: FetchImpl
  private readonly keyring: KeyringLike
  private readonly now: () => number
  private readonly cacheSize: number

  constructor(deps: TtsDeps) {
    this.fetchImpl = deps.fetchImpl ?? fetch
    this.keyring = deps.keyring
    this.now = deps.now ?? Date.now
    this.cacheSize = deps.cacheSize ?? DEFAULT_CACHE_SIZE
  }

  async speak(text: string, voice: VoiceChoice = 'male'): Promise<SpeechClip> {
    if (text.trim() === '') {
      throw new TtsProviderError(400, 'Refusing empty utterance')
    }
    const started = this.now()
    const reference = voice === 'female' ? FISH_FEMALE_REF : FISH_MALE_REF
    const cacheKey = `${reference}:${text}`
    const hit = this.cache.get(cacheKey)
    if (hit) {
      return { audio: hit, voice, cached: true, ms: this.now() - started }
    }
    const apiKey = this.keyring.checkout('fish')
    const response = await this.fetchImpl(FISH_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: FISH_MODEL,
        reference_id: reference,
        input: text,
        format: 'mp3'
      })
    })
    if (!response.ok) {
      throw new TtsProviderError(
        response.status,
        `Fish Audio rejected synthesis: ${response.status}`
      )
    }
    const audio = new Uint8Array(await response.arrayBuffer())
    this.cache.set(cacheKey, audio)
    if (this.cache.size > this.cacheSize) {
      const oldest = this.cache.keys().next()
      if (!oldest.done) {
        this.cache.delete(oldest.value)
      }
    }
    return { audio, voice, cached: false, ms: this.now() - started }
  }
}
