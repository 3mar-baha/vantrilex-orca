import type { MicBridge } from './MicToggle'
import type { VoiceChoice, VoiceStore } from './VoiceSelector'

const ARMED_KEY = 'vantrilex:voice:armed'
const VOICE_KEY = 'vantrilex:voice:choice'

const memoryFallback = new Map<string, string>()

function read(key: string, fallback: string): string {
  try {
    return window.localStorage.getItem(key) ?? fallback
  } catch {
    return memoryFallback.get(key) ?? fallback
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    memoryFallback.set(key, value)
  }
}

export const micBridge: MicBridge = {
  getArmed: () => read(ARMED_KEY, '0') === '1',
  setArmed: async (armed: boolean) => {
    write(ARMED_KEY, armed ? '1' : '0')
  }
}

export const voiceStore: VoiceStore = {
  getVoice: () => (read(VOICE_KEY, 'male') === 'female' ? 'female' : 'male'),
  setVoice: async (voice: VoiceChoice) => {
    write(VOICE_KEY, voice)
  }
}
