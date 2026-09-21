// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MobilePairingModal } from './MobilePairingModal'

function fakeRelay(ttlMs = 120_000) {
  return {
    createNonce: vi.fn(async () => ({ qr: 'QR-PAYLOAD', expiresAt: 1_000_000 + ttlMs }))
  }
}

afterEach(() => {
  cleanup()
})

describe('mobile pairing modal', () => {
  it('renders nothing when closed', () => {
    render(<MobilePairingModal relay={fakeRelay()} open={false} onClose={() => {}} />)
    expect(screen.queryByTestId('pairing-modal')).toBeNull()
  })

  it('shows the qr payload with expiry when open', async () => {
    render(<MobilePairingModal relay={fakeRelay()} open onClose={() => {}} now={() => 1_000_000} />)
    await vi.waitFor(() => {
      expect(screen.getByTestId('pairing-qr').textContent).toBe('QR-PAYLOAD')
    })
    expect(screen.getByTestId('pairing-expiry').textContent).toMatch(/120/)
  })

  it('closes through onClose and regenerates expired nonces', async () => {
    const relay = fakeRelay(0)
    const onClose = vi.fn()
    render(<MobilePairingModal relay={relay} open onClose={onClose} now={() => 2_000_000} />)
    await vi.waitFor(() => {
      expect(screen.getByTestId('pairing-expired')).toBeTruthy()
    })
    screen.getByTestId('pairing-close').click()
    expect(onClose).toHaveBeenCalledTimes(1)
    screen.getByTestId('pairing-regenerate').click()
    await vi.waitFor(() => {
      expect(relay.createNonce).toHaveBeenCalledTimes(2)
    })
  })
})
