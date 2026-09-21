import { describe, expect, it } from 'vitest'
import {
  RelayValidationError,
  registerRelayIpc,
  type RelayService
} from '../../src/main/mobile-relay/relay-ipc'

function fakeRelay(): RelayService & { pairs: number } {
  const service = {
    pairs: 0,
    ensure: async () => ({ lan: '192.168.1.20', port: 8787 }),
    pair: async () => {
      service.pairs += 1
      return { qr: 'vantrilex://pair?a=b', nonce: 'n', expiresAt: 1 }
    },
    approvals: () => [],
    onApproval: () => () => {}
  }
  return service
}

describe('relay ipc', () => {
  it('routes ensure, pair, and approvals', async () => {
    const handlers = new Map<string, (event: unknown, ...args: unknown[]) => unknown>()
    registerRelayIpc({ handle: (c, l) => handlers.set(c, l) }, fakeRelay())
    expect([...handlers.keys()].sort()).toEqual(['relay:approvals', 'relay:ensure', 'relay:pair'])
    await expect(handlers.get('relay:ensure')?.({}, {})).resolves.toMatchObject({ port: 8787 })
    await expect(handlers.get('relay:pair')?.({}, {})).resolves.toMatchObject({
      qr: expect.stringContaining('vantrilex://pair')
    })
    await expect(handlers.get('relay:approvals')?.({}, {})).resolves.toEqual([])
  })

  it('rejects malformed approval queries', async () => {
    const handlers = new Map<string, (event: unknown, ...args: unknown[]) => unknown>()
    registerRelayIpc({ handle: (c, l) => handlers.set(c, l) }, fakeRelay())
    await expect(handlers.get('relay:approvals')?.({}, null)).rejects.toThrow(RelayValidationError)
  })
})
