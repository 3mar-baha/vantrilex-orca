import { useState } from 'react'
import { translate } from '@/i18n/i18n'

export type MicBridge = {
  getArmed: () => boolean
  setArmed: (armed: boolean) => Promise<void>
}

export function MicToggle({ bridge, iconOnly }: { bridge: MicBridge; iconOnly?: boolean }) {
  const [armed, setArmed] = useState(bridge.getArmed())

  async function toggle(): Promise<void> {
    const next = !armed
    await bridge.setArmed(next)
    setArmed(next)
  }

  return (
    <button
      data-testid="mic-toggle"
      type="button"
      aria-pressed={armed}
      aria-label={translate(
        'auto.components.status.bar.VantrilexTriggers.micToggleLabel',
        armed ? 'Disarm voice input' : 'Arm voice input'
      )}
      className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      onClick={() => {
        void toggle()
      }}
    >
      <span aria-hidden>{armed ? '🎙' : '🎙̶'}</span>
      {iconOnly ? null : <span data-testid="mic-toggle-label">{armed ? 'Mic on' : 'Mic off'}</span>}
    </button>
  )
}
