import { ipcRenderer } from 'electron'
import type { VoiceApi, VoiceName } from './voice-api'

export const voiceApi: VoiceApi = {
  transcribe: (audio: number[]) => ipcRenderer.invoke('voice:transcribe', { audio }),
  think: (prompt: string) => ipcRenderer.invoke('voice:think', { prompt }),
  speak: (text: string, voice: VoiceName) => ipcRenderer.invoke('voice:speak', { text, voice })
}
