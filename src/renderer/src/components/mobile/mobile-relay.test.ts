import { describe, expect, it, vi } from 'vitest'
import { createMobileRelay } from './mobile-relay'

describe('mobile relay adapter', () => {
  it('ensures the daemon before minting the qr nonce', async () => {
    const ensure = vi.fn(async () => ({ lan: '192.168.1.20', port: 8787 }))
    const pair = vi.fn(async () => ({
      qr: 'vantrilex://pair?host=192.168.1.20&port=8787&nonce=abc',
      expiresAt: 999
    }))
    const relay = createMobileRelay({
      ensure,
      pair,
      approvals: async () => [],
      onApproval: () => () => {}
    })
    await expect(relay.createNonce()).resolves.toMatchObject({
      qr: expect.stringContaining('vantrilex://pair'),
      expiresAt: 999
    })
    expect(ensure).toHaveBeenCalledTimes(1)
  })
})
