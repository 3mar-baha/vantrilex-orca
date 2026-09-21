import type { AmmaniBrain } from './brain'
import type { GroqStt } from './stt'
import type { FishTts, VoiceChoice } from './tts'

export class VoiceValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VoiceValidationError'
  }
}

export type IpcHandleSeed = {
  handle: (channel: string, listener: (event: unknown, ...args: unknown[]) => unknown) => void
}

export type VoiceService = {
  transcribe: (audio: Uint8Array) => Promise<{ text: string; ms: number }>
  think: (prompt: string) => Promise<{ reply: string; ms: number }>
  speak: (
    text: string,
    voice: VoiceChoice
  ) => Promise<{ audio: Uint8Array; voice: VoiceChoice; ms: number }>
}

export type VoiceServiceDeps = {
  tts: FishTts
  stt: GroqStt
  brain: AmmaniBrain
}

const MAX_AUDIO_BYTES = 10 * 1024 * 1024

function isRecord(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === 'object' && payload !== null
}

function readAudio(payload: unknown): Uint8Array {
  if (!isRecord(payload)) {
    throw new VoiceValidationError('Voice request must be an object')
  }
  const raw = payload['audio']
  const bytes = Array.isArray(raw)
    ? Uint8Array.from(raw as number[])
    : (raw as Uint8Array | undefined)
  if (!(bytes instanceof Uint8Array) || bytes.length === 0) {
    throw new VoiceValidationError('Transcription requires non-empty audio')
  }
  if (bytes.length > MAX_AUDIO_BYTES) {
    throw new VoiceValidationError('Audio exceeds the 10MB cap')
  }
  return bytes
}

function readText(payload: unknown, field: string): string {
  if (
    !isRecord(payload) ||
    typeof payload[field] !== 'string' ||
    (payload[field] as string).trim() === ''
  ) {
    throw new VoiceValidationError(`Voice request requires a non-empty '${field}'`)
  }
  return (payload[field] as string).trim()
}

function readVoice(payload: unknown): VoiceChoice {
  if (!isRecord(payload) || (payload['voice'] !== 'male' && payload['voice'] !== 'female')) {
    throw new VoiceValidationError("Voice request requires voice 'male' or 'female'")
  }
  return payload['voice']
}

export function createVoiceService(deps: VoiceServiceDeps): VoiceService {
  return {
    transcribe: (audio) => deps.stt.transcribe(audio),
    think: (prompt) => deps.brain.think(prompt),
    speak: (text, voice) => deps.tts.speak(text, voice)
  }
}

export function registerVoiceIpc(ipc: IpcHandleSeed, service: VoiceService): void {
  ipc.handle('voice:transcribe', async (_event, payload: unknown) =>
    service.transcribe(readAudio(payload))
  )
  ipc.handle('voice:think', async (_event, payload: unknown) =>
    service.think(readText(payload, 'prompt'))
  )
  ipc.handle('voice:speak', async (_event, payload: unknown) =>
    service.speak(readText(payload, 'text'), readVoice(payload))
  )
}
