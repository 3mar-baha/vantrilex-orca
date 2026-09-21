// @vitest-environment happy-dom

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { MicToggle } from '../../src/renderer/src/components/voice/MicToggle'
import { VoiceSelector } from '../../src/renderer/src/components/voice/VoiceSelector'
import { ShowcaseButton } from '../../src/renderer/src/components/showcase/ShowcaseButton'
import { MobilePairingModal } from '../../src/renderer/src/components/mobile/MobilePairingModal'

afterEach(() => {
  cleanup()
})

describe('trigger composition', () => {
  it('mounts the four triggers in order inside a status-bar-height row', () => {
    render(
      <TooltipProvider>
        <div data-testid="trigger-row" className="flex h-6 min-h-[24px] items-center gap-3">
          <MicToggle bridge={{ getArmed: () => false, setArmed: async () => {} }} iconOnly />
          <ShowcaseButton runner={{ generate: async () => ({ path: 'docs/showcase.html' }) }} />
          <VoiceSelector store={{ getVoice: () => 'male' as const, setVoice: async () => {} }} />
          <MobilePairingModal
            relay={{ createNonce: async () => ({ qr: '', expiresAt: 0 }) }}
            open={false}
            onClose={() => {}}
          />
        </div>
      </TooltipProvider>
    )
    const row = screen.getByTestId('trigger-row')
    const order = [...row.querySelectorAll('[data-testid]')]
      .map((el) => el.getAttribute('data-testid'))
      .filter((id) => id !== 'trigger-row')
    expect(order[0]).toBe('mic-toggle')
    expect(order).toContain('showcase-button')
    expect(order).toContain('voice-selector')
    expect(row.className).toContain('h-6')
  })
})

describe('status bar surface wiring', () => {
  it('imports and renders the four triggers in the right group', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/renderer/src/components/status-bar/StatusBarSurface.tsx'),
      'utf8'
    )
    for (const name of ['MicToggle', 'ShowcaseButton', 'MobilePairingModal', 'VoiceSelector']) {
      expect(source).toContain(name)
    }
    const rightGroup = source.indexOf('<div className="flex-1" />')
    for (const name of ['<MicToggle', '<ShowcaseButton', '<VoiceSelector']) {
      expect(source.indexOf(name)).toBeGreaterThan(rightGroup)
    }
    expect(source).toContain('lazyWithRetry')
  })
})
