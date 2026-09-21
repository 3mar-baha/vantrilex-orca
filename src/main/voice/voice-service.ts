import { join } from 'node:path'
import { app } from 'electron'
import { AmmaniBrain } from './brain'
import { DpapiStore } from './dpapi-store'
import { GroqStt } from './stt'
import { FishTts } from './tts'
import { Keyring } from './keyring'
import { createVoiceService, type VoiceService } from './voice-ipc'

export type VoiceStack = {
  keyring: Keyring
  tts: FishTts
  stt: GroqStt
  brain: AmmaniBrain
  service: VoiceService
}

export function createVoiceStack(): VoiceStack {
  const file = join(app.getPath('userData'), 'vantrilex', 'keyring.json')
  const keyring = new Keyring(new DpapiStore(file))
  const tts = new FishTts({ keyring })
  const stt = new GroqStt({ keyring })
  const brain = new AmmaniBrain({ keyring })
  return { keyring, tts, stt, brain, service: createVoiceService({ tts, stt, brain }) }
}
