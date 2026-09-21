import { useState } from 'react'
import { translate } from '@/i18n/i18n'
import { SHOWCASE_GENERATION_PROMPT } from './showcase-prompt'

export type ShowcaseRunner = {
  generate: () => Promise<{ path: string }>
}

export type ShowcaseInjector = {
  inject: (prompt: string) => Promise<{ sessionId: string }>
}

export function ShowcaseButton({
  runner,
  injector = null
}: {
  runner: ShowcaseRunner
  injector?: ShowcaseInjector | null
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
      setStatus((error as Error).message)
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
      setStatus((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
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
        ★
      </button>
      {status ? <span data-testid="showcase-status">{status}</span> : null}
    </span>
  )
}
