import type { MobileApi } from '../../../../preload/api/mobile-api'
import type { PairingRelay } from './MobilePairingModal'

const NONCE_TTL_MS = 120_000

export function createMobileRelay(
  mobile: Pick<MobileApi, 'getPairingQR'>,
  clock: () => number = Date.now
): PairingRelay {
  return {
    createNonce: async () => {
      const qr = await mobile.getPairingQR()
      if (!qr.available) {
        throw new Error(`Pairing relay unavailable (${qr.reason ?? 'unknown'})`)
      }
      if (!qr.qrDataUrl && !qr.pairingUrl) {
        throw new Error('Pairing relay returned no code')
      }
      return { qr: qr.qrDataUrl ?? qr.pairingUrl, expiresAt: clock() + NONCE_TTL_MS }
    }
  }
}
