import { useState } from 'react'
import { KeyRound, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { translate } from '@/i18n/i18n'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useActiveRepo } from '../../store/selectors'
import { MicToggle } from '../voice/MicToggle'
import { VoiceSelector } from '../voice/VoiceSelector'
import { micBridge, voiceLoop, voiceStore } from '../voice/voice-ui-state'
import { ApiKeysModal } from '../voice/ApiKeysModal'
import { ShowcaseButton } from '../showcase/ShowcaseButton'
import { createShowcaseRunner } from '../showcase/showcase-runner'
import { MobilePairingModal } from '../mobile/MobilePairingModal'
import { createMobileRelay } from '../mobile/mobile-relay'

export function VantrilexToolbar() {
  const activeRepo = useActiveRepo()
  const [pairingOpen, setPairingOpen] = useState(false)
  const [keysOpen, setKeysOpen] = useState(false)
  const keyring = {
    status: () => window.api.voice.keyringStatus(),
    set: (pool: 'fish' | 'groq', key: string) => window.api.voice.keyringSet(pool, key)
  }

  return (
    <div data-testid="vantrilex-toolbar" className="flex min-w-0 items-center gap-1">
      <MicToggle
        bridge={micBridge}
        iconOnly
        loop={voiceLoop}
        voice={voiceStore.getVoice()}
        onMissingKeys={() => setKeysOpen(true)}
        onError={(message) => toast.error(message)}
      />
      <VoiceSelector store={voiceStore} />
      <ShowcaseButton
        runner={createShowcaseRunner(activeRepo?.path ?? null, window.api.shell)}
        injector={{
          inject: (prompt) =>
            window.api.runnerTerminal.inject(prompt, { workspace: activeRepo?.path ?? undefined })
        }}
        onError={(message) => toast.error(message)}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            data-testid="pairing-trigger"
            type="button"
            aria-label={translate(
              'auto.components.status.bar.VantrilexTriggers.pairingTitle',
              'Pair mobile device'
            )}
            className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setPairingOpen(true)}
          >
            <span aria-hidden>
              <Smartphone size={12} />
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          {translate(
            'auto.components.status.bar.VantrilexTriggers.pairingTip',
            'Pair a mobile device — scan the QR to approve runner steps remotely.'
          )}
        </TooltipContent>
      </Tooltip>
      {pairingOpen ? (
        <MobilePairingModal
          relay={createMobileRelay(window.api.relay)}
          open
          onClose={() => setPairingOpen(false)}
        />
      ) : null}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            data-testid="keys-trigger"
            type="button"
            aria-label={translate(
              'auto.components.status.bar.VantrilexTriggers.keysTitle',
              'API keys'
            )}
            className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setKeysOpen(true)}
          >
            <span aria-hidden>
              <KeyRound size={12} />
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          {translate('auto.components.status.bar.VantrilexTriggers.keysTitle', 'API keys')}
        </TooltipContent>
      </Tooltip>
      {keysOpen ? <ApiKeysModal keyring={keyring} open onClose={() => setKeysOpen(false)} /> : null}
    </div>
  )
}
