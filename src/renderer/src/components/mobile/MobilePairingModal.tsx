import { useEffect, useState } from 'react'
import { translate } from '@/i18n/i18n'

export type PairingRelay = {
  createNonce: () => Promise<{ qr: string; expiresAt: number }>
}

export function MobilePairingModal({
  relay,
  open,
  onClose,
  now
}: {
  relay: PairingRelay
  open: boolean
  onClose: () => void
  now?: () => number
}): React.JSX.Element | null {
  const [nonce, setNonce] = useState<{ qr: string; expiresAt: number } | null>(null)
  const clock = now ?? Date.now

  useEffect(() => {
    if (!open) {
      return
    }
    let cancelled = false
    relay.createNonce().then((fresh) => {
      if (!cancelled) {
        setNonce(fresh)
      }
    })
    return () => {
      cancelled = true
    }
  }, [open, relay])

  if (!open) {
    return null
  }
  const expired = nonce !== null && clock() >= nonce.expiresAt
  const remaining = nonce === null ? 0 : Math.max(0, Math.round((nonce.expiresAt - clock()) / 1000))

  return (
    <div
      data-testid="pairing-modal"
      role="dialog"
      aria-modal="true"
      className="rounded border bg-card p-2"
    >
      <div className="flex items-center justify-between">
        <span>
          {translate(
            'auto.components.status.bar.VantrilexTriggers.pairingTitle',
            'Pair mobile device'
          )}
        </span>
        <button
          data-testid="pairing-close"
          type="button"
          aria-label={translate(
            'auto.components.status.bar.VantrilexTriggers.pairingClose',
            'Close'
          )}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {nonce ? (
        <div data-testid="pairing-qr">{nonce.qr}</div>
      ) : (
        <div data-testid="pairing-qr">…</div>
      )}
      {expired ? (
        <div>
          <span data-testid="pairing-expired">
            {translate(
              'auto.components.status.bar.VantrilexTriggers.pairingExpired',
              'Code expired'
            )}
          </span>
          <button
            data-testid="pairing-regenerate"
            type="button"
            onClick={() => {
              relay.createNonce().then(setNonce)
            }}
          >
            {translate(
              'auto.components.status.bar.VantrilexTriggers.pairingRegenerate',
              'Regenerate'
            )}
          </button>
        </div>
      ) : (
        <div data-testid="pairing-expiry">Expires in {remaining}s</div>
      )}
    </div>
  )
}
