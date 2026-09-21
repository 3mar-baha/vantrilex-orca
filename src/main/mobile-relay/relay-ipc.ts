import type { ApprovalVerdict, MobileRelay, PairedNonce, RelayInfo } from './relay-server'

export class RelayValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RelayValidationError'
  }
}

export type IpcHandleSeed = {
  handle: (channel: string, listener: (event: unknown, ...args: unknown[]) => unknown) => void
}

export type RelayService = {
  ensure: () => Promise<RelayInfo>
  pair: () => Promise<PairedNonce & { nonce: string }>
  approvals: () => ApprovalVerdict[]
  onApproval: (listener: (verdict: ApprovalVerdict) => void) => () => void
}

function requireObject(payload: unknown): Record<string, unknown> {
  if (typeof payload !== 'object' || payload === null) {
    throw new RelayValidationError('Relay request must be an object')
  }
  return payload as Record<string, unknown>
}

export function relayServiceFrom(server: MobileRelay): RelayService {
  return {
    ensure: () => server.ensure(),
    pair: () => server.pair(),
    approvals: () => server.drainApprovals(),
    onApproval: (listener) => server.onApproval(listener)
  }
}

export function registerRelayIpc(ipc: IpcHandleSeed, service: RelayService): void {
  ipc.handle('relay:ensure', async (_event, payload: unknown) => {
    requireObject(payload)
    return service.ensure()
  })
  ipc.handle('relay:pair', async (_event, payload: unknown) => {
    requireObject(payload)
    const paired = await service.pair()
    return { qr: paired.qr, expiresAt: paired.expiresAt }
  })
  ipc.handle('relay:approvals', async (_event, payload: unknown) => {
    requireObject(payload)
    return service.approvals()
  })
}
