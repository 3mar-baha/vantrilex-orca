import type { PreloadApi } from '../../../../preload/api-types'

function unsupported(method: string): Error {
  return new Error(`voice.${method} is unsupported in the web client`)
}

export function createWebVoiceApi(): Partial<PreloadApi> {
  return {
    voice: {
      transcribe: () => Promise.reject(unsupported('transcribe')),
      think: () => Promise.reject(unsupported('think')),
      speak: () => Promise.reject(unsupported('speak'))
    }
  }
}
