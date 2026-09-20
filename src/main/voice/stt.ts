import type { FetchImpl, KeyringLike } from './tts'

export const WHISPER_MODEL = 'whisper-large-v3-turbo'
const GROQ_AUDIO_ENDPOINT = 'https://api.groq.com/openai/v1/audio/transcriptions'

export type Transcript = {
  text: string
  ms: number
}

export class SttProviderError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'SttProviderError'
    this.status = status
  }
}

export type SttDeps = {
  fetchImpl?: FetchImpl
  keyring: KeyringLike
  now?: () => number
}

export class GroqStt {
  private readonly fetchImpl: FetchImpl
  private readonly keyring: KeyringLike
  private readonly now: () => number

  constructor(deps: SttDeps) {
    this.fetchImpl = deps.fetchImpl ?? fetch
    this.keyring = deps.keyring
    this.now = deps.now ?? Date.now
  }

  async transcribe(audio: Uint8Array, filename = 'audio.mp3'): Promise<Transcript> {
    if (audio.length === 0) {
      throw new SttProviderError(400, 'Refusing empty audio')
    }
    const started = this.now()
    const apiKey = this.keyring.checkout('groq')
    const form = new FormData()
    form.set('model', WHISPER_MODEL)
    form.set('file', new Blob([audio.buffer as ArrayBuffer], { type: 'audio/mpeg' }), filename)
    const response = await this.fetchImpl(GROQ_AUDIO_ENDPOINT, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}` },
      body: form
    })
    if (!response.ok) {
      throw new SttProviderError(response.status, `Groq rejected transcription: ${response.status}`)
    }
    const payload = (await response.json()) as { text?: unknown }
    if (typeof payload.text !== 'string' || payload.text.trim() === '') {
      throw new SttProviderError(422, 'Transcription returned no text')
    }
    return { text: payload.text.trim(), ms: this.now() - started }
  }
}
