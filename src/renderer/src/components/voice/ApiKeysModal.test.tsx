// @vitest-environment happy-dom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ApiKeysModal, type KeyringClient } from './ApiKeysModal'

function fakeKeyring(present: Record<'fish' | 'groq', boolean> = { fish: false, groq: false }) {
  const saved: { pool: string; key: string }[] = []
  const state = { ...present }
  const client: KeyringClient & { saved: typeof saved } = {
    saved,
    status: async () => ({ ...state }),
    set: async (pool: 'fish' | 'groq', key: string) => {
      saved.push({ pool, key })
      state[pool] = true
      return { configured: true }
    }
  }
  return client
}

function renderModal(client: KeyringClient) {
  return render(
    <TooltipProvider>
      <ApiKeysModal keyring={client} open onClose={() => {}} />
    </TooltipProvider>
  )
}

afterEach(() => {
  cleanup()
})

describe('api keys modal', () => {
  it('renders nothing when closed', () => {
    render(<ApiKeysModal keyring={fakeKeyring()} open={false} onClose={() => {}} />)
    expect(screen.queryByTestId('keys-modal')).toBeNull()
  })

  it('shows live presence badges from status', async () => {
    renderModal(fakeKeyring({ fish: true, groq: false }))
    await vi.waitFor(() => {
      expect(screen.getByTestId('keys-badge-fish').textContent).toContain('present')
    })
    expect(screen.getByTestId('keys-badge-groq').textContent).toContain('missing')
  })

  it('saves a key and refreshes its badge without echoing the value', async () => {
    const client = fakeKeyring()
    renderModal(client)
    await vi.waitFor(() => {
      expect(screen.getByTestId('keys-badge-groq').textContent).toContain('missing')
    })
    const input = screen.getByTestId('keys-input-groq') as HTMLInputElement
    expect(input.type).toBe('password')
    fireEvent.change(input, { target: { value: 'gsk-live-value' } })
    screen.getByTestId('keys-toggle-groq').click()
    await vi.waitFor(() => {
      expect((screen.getByTestId('keys-input-groq') as HTMLInputElement).type).toBe('text')
    })
    screen.getByTestId('keys-save-groq').click()
    await vi.waitFor(() => {
      expect(client.saved).toEqual([{ pool: 'groq', key: 'gsk-live-value' }])
    })
    await vi.waitFor(() => {
      expect(screen.getByTestId('keys-badge-groq').textContent).toContain('present')
    })
    expect(document.body.textContent).not.toContain('gsk-live-value')
  })

  it('masks entry by default and never saves blank keys', async () => {
    const client = fakeKeyring()
    const set = vi.spyOn(client, 'set')
    renderModal(client)
    await vi.waitFor(() => {
      expect(screen.getByTestId('keys-modal')).toBeTruthy()
    })
    expect((screen.getByTestId('keys-input-fish') as HTMLInputElement).type).toBe('password')
    screen.getByTestId('keys-save-fish').click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(set).not.toHaveBeenCalled()
  })
})
