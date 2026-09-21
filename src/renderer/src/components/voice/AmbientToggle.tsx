import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { translate } from '@/i18n/i18n'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type AmbientBridge = {
  status: () => Promise<{ armed: boolean; pending: number }>
  arm: (armed: boolean) => Promise<void>
}

export function AmbientToggle({ bridge }: { bridge: AmbientBridge }) {
  const [armed, setArmed] = useState(true)

  useEffect(() => {
    let cancelled = false
    bridge
      .status()
      .then((state) => {
        if (!cancelled) {
          setArmed(state.armed)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [bridge])

  async function toggle(): Promise<void> {
    const next = !armed
    try {
      await bridge.arm(next)
      setArmed(next)
    } catch {
      // Keep the last known state when the main side is unreachable.
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          data-testid="ambient-toggle"
          type="button"
          aria-pressed={armed}
          aria-label={translate(
            'auto.components.status.bar.VantrilexTriggers.ambientToggleLabel',
            armed ? 'Mute ambient briefings' : 'Arm ambient briefings'
          )}
          className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => {
            void toggle()
          }}
        >
          <span aria-hidden>{armed ? <Bell size={12} /> : <BellOff size={12} />}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        {armed
          ? translate(
              'auto.components.status.bar.VantrilexTriggers.ambientTipArmed',
              'Ambient briefings armed — runner conclusions are spoken. Click to mute (watcher keeps recording).'
            )
          : translate(
              'auto.components.status.bar.VantrilexTriggers.ambientTipMuted',
              'Ambient briefings muted — click to arm spoken task briefings.'
            )}
      </TooltipContent>
    </Tooltip>
  )
}
