// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { MicToggle, type MicBridge } from './MicToggle'

function fakeBridge(armed = false): MicBridge & { calls: boolean[] } {
  const calls: boolean[] = []
  return {
    calls,
    getArmed: () => calls.at(-1) ?? armed,
    setArmed: async (next: boolean) => {
      calls.push(next)
    }
  }
}

afterEach(() => {
  cleanup()
})

describe('mic toggle', () => {
  it('renders the armed state from the bridge', () => {
    render(
      <TooltipProvider>
        <MicToggle bridge={fakeBridge(true)} />
      </TooltipProvider>
    )
    expect(screen.getByTestId('mic-toggle').getAttribute('aria-pressed')).toBe('true')
  })

  it('disarms on click through the bridge', async () => {
    const bridge = fakeBridge(true)
    const setArmed = vi.spyOn(bridge, 'setArmed')
    render(
      <TooltipProvider>
        <MicToggle bridge={bridge} />
      </TooltipProvider>
    )
    screen.getByTestId('mic-toggle').click()
    await vi.waitFor(() => {
      expect(setArmed).toHaveBeenCalledWith(false)
    })
    await vi.waitFor(() => {
      expect(screen.getByTestId('mic-toggle').getAttribute('aria-pressed')).toBe('false')
    })
  })

  it('hides the label in icon-only mode', () => {
    render(
      <TooltipProvider>
        <MicToggle bridge={fakeBridge(false)} iconOnly />
      </TooltipProvider>
    )
    expect(screen.queryByTestId('mic-toggle-label')).toBeNull()
    expect(screen.getByTestId('mic-toggle')).toBeTruthy()
  })
})
