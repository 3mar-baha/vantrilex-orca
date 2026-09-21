// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AmbientToggle, type AmbientBridge } from './AmbientToggle'

function fakeBridge(armed = true): AmbientBridge & { arms: boolean[] } {
  const arms: boolean[] = []
  return {
    arms,
    status: async () => ({ armed, pending: 0 }),
    arm: async (next: boolean) => {
      arms.push(next)
    }
  }
}

afterEach(() => {
  cleanup()
})

describe('ambient toggle', () => {
  it('syncs the armed state from the main side', async () => {
    render(
      <TooltipProvider>
        <AmbientToggle bridge={fakeBridge(false)} />
      </TooltipProvider>
    )
    await vi.waitFor(() => {
      expect(screen.getByTestId('ambient-toggle').getAttribute('aria-pressed')).toBe('false')
    })
  })

  it('mutes through the bridge on click', async () => {
    const bridge = fakeBridge(true)
    const arm = vi.spyOn(bridge, 'arm')
    render(
      <TooltipProvider>
        <AmbientToggle bridge={bridge} />
      </TooltipProvider>
    )
    await vi.waitFor(() => {
      expect(screen.getByTestId('ambient-toggle').getAttribute('aria-pressed')).toBe('true')
    })
    screen.getByTestId('ambient-toggle').click()
    await vi.waitFor(() => {
      expect(arm).toHaveBeenCalledWith(false)
    })
    await vi.waitFor(() => {
      expect(screen.getByTestId('ambient-toggle').getAttribute('aria-pressed')).toBe('false')
    })
  })

  it('keeps the last known state when arming fails', async () => {
    const bridge = fakeBridge(true)
    bridge.arm = async () => {
      throw new Error('ipc down')
    }
    render(
      <TooltipProvider>
        <AmbientToggle bridge={bridge} />
      </TooltipProvider>
    )
    await vi.waitFor(() => {
      expect(screen.getByTestId('ambient-toggle').getAttribute('aria-pressed')).toBe('true')
    })
    screen.getByTestId('ambient-toggle').click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(screen.getByTestId('ambient-toggle').getAttribute('aria-pressed')).toBe('true')
  })
})
