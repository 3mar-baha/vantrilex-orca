import { useState } from 'react'
import { LayoutTemplate } from 'lucide-react'
import { translate } from '@/i18n/i18n'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SHOWCASE_GENERATION_PROMPT } from './showcase-prompt'

export type ShowcaseRunner = {
  generate: () => Promise<{ path: string }>
}

export type ShowcaseInjector = {
  inject: (prompt: string) => Promise<{ sessionId: string }>
}

export function ShowcaseButton({
  runner,
  injector = null,
  onError
}: {
  runner: ShowcaseRunner
  injector?: ShowcaseInjector | null
  onError?: (message: string) => void
}) {
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function generate(): Promise<void> {
    if (busy) {
      return
    }
    setBusy(true)
    try {
      const result = await runner.generate()
      setStatus(result.path)
    } catch (error) {
      reportError((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function inject(): Promise<void> {
    if (busy || !injector) {
      return
    }
    setBusy(true)
    try {
      const result = await injector.inject(SHOWCASE_GENERATION_PROMPT)
      setStatus(`Injected into ${result.sessionId}`)
    } catch (error) {
      reportError((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function reportError(message: string): void {
    if (onError) {
      onError(message)
      setStatus(null)
    } else {
      setStatus(message)
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            data-testid="showcase-button"
            type="button"
            disabled={busy}
            aria-label={translate(
              'auto.components.status.bar.VantrilexTriggers.showcaseOpen',
              'Open project showcase'
            )}
            className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            onClick={(event) => {
              if (event.shiftKey) {
                void inject()
              } else {
                void generate()
              }
            }}
          >
            <span aria-hidden>
              <LayoutTemplate size={12} />
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          {translate(
            'auto.components.status.bar.VantrilexTriggers.showcaseTip',
            'Project showcase — click to open, Shift+Click to regenerate it in the active runner.'
          )}
        </TooltipContent>
      </Tooltip>
      {status ? <span data-testid="showcase-status">{status}</span> : null}
    </span>
  )
}
