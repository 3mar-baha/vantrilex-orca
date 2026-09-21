import type { RelayApi } from '../../../../preload/api/relay-api'
import type { PairingRelay } from './MobilePairingModal'

export function createMobileRelay(relay: RelayApi): PairingRelay {
  return {
    createNonce: async () => {
      await relay.ensure()
      const paired = await relay.pair()
      return { qr: paired.qr, expiresAt: paired.expiresAt }
    }
  }
}
