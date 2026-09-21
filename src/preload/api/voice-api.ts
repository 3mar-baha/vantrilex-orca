export type VoiceName = 'male' | 'female'

export type KeyPoolName = 'fish' | 'groq'

export type VoiceApi = {
  transcribe: (audio: number[]) => Promise<{ text: string; ms: number }>
  think: (prompt: string) => Promise<{ reply: string; ms: number }>
  speak: (
    text: string,
    voice: VoiceName
  ) => Promise<{ audio: number[]; voice: VoiceName; ms: number }>
  keyringStatus: () => Promise<Record<KeyPoolName, boolean>>
  keyringSet: (pool: KeyPoolName, key: string) => Promise<{ configured: boolean }>
}
