// @vitest-environment happy-dom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FoundryToasts } from './FoundryToasts'
import { resetFoundryToastBusForTest } from './foundry-toast-bus'
import { useFoundryBackgroundProvision } from './use-foundry-background-provision'
import { useState } from 'react'

afterEach(() => {
  cleanup()
  resetFoundryToastBusForTest()
  vi.useRealTimers()
  delete (window as unknown as { api?: unknown }).api
})

function Harness({ path }: { path: string | null }) {
  useFoundryBackgroundProvision(path)
  return <FoundryToasts />
}

describe('background provision toasts', () => {
  it('runs detached on workspace open without blocking', async () => {
    let resolveProvision!: (value: { created: string[]; errors: string[] }) => void
    const provisioned = new Promise<{ created: string[]; errors: string[] }>((resolve) => {
      resolveProvision = resolve
    })
    ;(window as unknown as { api: unknown }).api = {
      foundry: {
        detect: async () => ({
          projectCase: 1,
          language: 'None yet',
          stack: 'Greenfield',
          action: 'Found it.'
        }),
        provision: () => provisioned
      }
    }
    function Switcher() {
      const [path, setPath] = useState<string | null>(null)
      return (
        <>
          <button data-testid="open" onClick={() => setPath('/repo/demo')}>
            open
          </button>
          <Harness path={path} />
        </>
      )
    }
    render(<Switcher />)
    expect(screen.queryByTestId('foundry-toasts')).toBeNull()
    screen.getByTestId('open').click()
    await waitFor(() => {
      expect(screen.getByTestId('foundry-toasts').textContent).toContain(
        'Scanning workspace in background...'
      )
    })
    resolveProvision({ created: ['docs/01.md'], errors: [] })
    await waitFor(() => {
      expect(screen.getByTestId('foundry-toasts').textContent).toContain('✓ Workspace configured')
    })
  })

  it('does nothing without a workspace path', () => {
    render(<Harness path={null} />)
    expect(screen.queryByTestId('foundry-toasts')).toBeNull()
  })
})
