import { useEffect, useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { translate } from '@/i18n/i18n'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type KeyPool = 'fish' | 'groq'

export type KeyringClient = {
  status: () => Promise<Record<KeyPool, boolean>>
  set: (pool: KeyPool, key: string) => Promise<{ configured: boolean }>
}

const POOLS: { id: KeyPool; label: string }[] = [
  { id: 'groq', label: 'GROQ_API_KEY' },
  { id: 'fish', label: 'FISH_AUDIO_API_KEY' }
]

export function ApiKeysModal({
  keyring,
  open,
  onClose
}: {
  keyring: KeyringClient
  open: boolean
  onClose: () => void
}): React.JSX.Element | null {
  const [present, setPresent] = useState<Record<KeyPool, boolean>>({ fish: false, groq: false })
  const [values, setValues] = useState<Record<KeyPool, string>>({ fish: '', groq: '' })
  const [visible, setVisible] = useState<Record<KeyPool, boolean>>({ fish: false, groq: false })
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    let cancelled = false
    keyring
      .status()
      .then((state) => {
        if (!cancelled) {
          setPresent(state)
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setNote(error.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [open, keyring])

  async function save(pool: KeyPool): Promise<void> {
    const key = values[pool].trim()
    if (key === '') {
      return
    }
    try {
      const result = await keyring.set(pool, key)
      setPresent((current) => ({ ...current, [pool]: result.configured }))
      setValues((current) => ({ ...current, [pool]: '' }))
      setNote(null)
    } catch (error) {
      setNote((error as Error).message)
    }
  }

  if (!open) {
    return null
  }

  return (
    <div
      data-testid="keys-modal"
      role="dialog"
      aria-modal="true"
      aria-label={translate('auto.components.status.bar.VantrilexTriggers.keysTitle', 'API keys')}
      className="rounded border bg-card p-2"
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1">
          <span aria-hidden>
            <KeyRound size={12} />
          </span>
          {translate('auto.components.status.bar.VantrilexTriggers.keysTitle', 'API keys')}
        </span>
        <button
          data-testid="keys-close"
          type="button"
          aria-label={translate('auto.components.status.bar.VantrilexTriggers.keysClose', 'Close')}
          className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <p className="text-muted-foreground">
        {translate(
          'auto.components.status.bar.VantrilexTriggers.keysGuidance',
          'Keys stay in OS-encrypted storage and never leave this machine except to their provider.'
        )}
      </p>
      {POOLS.map((pool) => (
        <div key={pool.id} className="flex items-center gap-1">
          <span className="w-36">{pool.label}</span>
          <span data-testid={`keys-badge-${pool.id}`}>
            {present[pool.id] ? '● present' : '○ missing'}
          </span>
          <input
            data-testid={`keys-input-${pool.id}`}
            type={visible[pool.id] ? 'text' : 'password'}
            value={values[pool.id]}
            aria-label={pool.label}
            className="rounded border bg-secondary px-1 py-0.5"
            onChange={(event) =>
              setValues((current) => ({ ...current, [pool.id]: event.target.value }))
            }
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                data-testid={`keys-toggle-${pool.id}`}
                type="button"
                aria-label={translate(
                  'auto.components.status.bar.VantrilexTriggers.keysToggle',
                  'Toggle visibility'
                )}
                className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                onClick={() =>
                  setVisible((current) => ({ ...current, [pool.id]: !current[pool.id] }))
                }
              >
                <span aria-hidden>
                  {visible[pool.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              {translate(
                'auto.components.status.bar.VantrilexTriggers.keysToggle',
                'Toggle visibility'
              )}
            </TooltipContent>
          </Tooltip>
          <button
            data-testid={`keys-save-${pool.id}`}
            type="button"
            disabled={values[pool.id].trim() === ''}
            className="rounded border px-1 py-0.5 disabled:opacity-40"
            onClick={() => {
              void save(pool.id)
            }}
          >
            {translate('auto.components.status.bar.VantrilexTriggers.keysSave', 'Save')}
          </button>
        </div>
      ))}
      {note ? <span data-testid="keys-note">{note}</span> : null}
    </div>
  )
}
