import { useState } from 'react'
import { translate } from '@/i18n/i18n'

export type VoiceChoice = 'male' | 'female'

export type VoiceStore = {
  getVoice: () => VoiceChoice
  setVoice: (voice: VoiceChoice) => Promise<void>
}

export function VoiceSelector({ store }: { store: VoiceStore }) {
  const [voice, setVoice] = useState<VoiceChoice>(store.getVoice())

  async function change(next: VoiceChoice): Promise<void> {
    await store.setVoice(next)
    setVoice(next)
  }

  return (
    <label className="inline-flex items-center gap-1 text-muted-foreground">
      <span>{translate('auto.components.status.bar.VantrilexTriggers.voiceLabel', 'Voice')}</span>
      <select
        data-testid="voice-selector"
        value={voice}
        aria-label={translate('auto.components.status.bar.VantrilexTriggers.voiceLabel', 'Voice')}
        className="rounded bg-secondary px-1 py-0.5 text-secondary-foreground"
        onChange={(event) => {
          const next = event.target.value
          if (next === 'male' || next === 'female') {
            void change(next)
          }
        }}
      >
        <option value="male">
          {translate('auto.components.status.bar.VantrilexTriggers.voiceMale', 'Male')}
        </option>
        <option value="female">
          {translate('auto.components.status.bar.VantrilexTriggers.voiceFemale', 'Female')}
        </option>
      </select>
    </label>
  )
}
