// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { VantrilexToolbar } from './VantrilexToolbar'

const api = {
  shell: { openPath: vi.fn(async () => {}) },
  voice: {
    keyringStatus: vi.fn(async () => ({ fish: false, groq: false })),
    keyringSet: vi.fn(async () => ({ configured: true }))
  },
  relay: {
    ensure: vi.fn(async () => ({ lan: null, port: 8787 })),
    pair: vi.fn(async () => ({ qr: 'q', expiresAt: 1 })),
    approvals: vi.fn(async () => []),
    onApproval: vi.fn(() => () => {})
  },
  runnerTerminal: {
    inject: vi.fn(async () => ({ sessionId: 'session-1' }))
  }
}

function stubApi() {
  Object.defineProperty(window, 'api', { value: api, configurable: true })
}

beforeEach(() => {
  stubApi()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

vi.mock('@/store/selectors', () => ({
  useActiveRepo: () => ({ path: 'O:/repo' })
}))

describe('vantrilex toolbar cluster', () => {
  it('mounts all five triggers in the sidebar footer row', () => {
    render(
      <TooltipProvider>
        <VantrilexToolbar />
      </TooltipProvider>
    )
    expect(screen.getByTestId('vantrilex-toolbar')).toBeTruthy()
    expect(screen.getByTestId('mic-toggle')).toBeTruthy()
    expect(screen.getByTestId('voice-selector')).toBeTruthy()
    expect(screen.getByTestId('showcase-button')).toBeTruthy()
    expect(screen.getByTestId('pairing-trigger')).toBeTruthy()
    expect(screen.getByTestId('keys-trigger')).toBeTruthy()
  })

  it('opens the keys modal from the keys trigger', async () => {
    render(
      <TooltipProvider>
        <VantrilexToolbar />
      </TooltipProvider>
    )
    screen.getByTestId('keys-trigger').click()
    await vi.waitFor(() => {
      expect(screen.getByTestId('keys-modal')).toBeTruthy()
    })
  })

  it('opens key intake automatically when the mic reports missing keys', async () => {
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn(async () => ({})) },
      configurable: true
    })
    class FakeRecorder {
      ondataavailable: ((event: { data: Blob }) => void) | null = null
      onstop: (() => void) | null = null
      start() {}
      stop() {
        this.ondataavailable?.({ data: new Blob(['x']) })
        this.onstop?.()
      }
    }
    Object.defineProperty(window, 'MediaRecorder', { value: FakeRecorder, configurable: true })
    Object.assign(api.voice, {
      transcribe: vi.fn(async () => {
        throw new Error("Keyring pool 'groq' has no keys")
      }),
      think: vi.fn(async () => ({ reply: '', ms: 1 })),
      speak: vi.fn(async () => ({ audio: [], voice: 'male' as const, ms: 1 }))
    })
    render(
      <TooltipProvider>
        <VantrilexToolbar />
      </TooltipProvider>
    )
    screen.getByTestId('mic-toggle').click()
    await new Promise((resolve) => setTimeout(resolve, 10))
    screen.getByTestId('mic-toggle').click()
    await vi.waitFor(() => {
      expect(screen.getByTestId('keys-modal')).toBeTruthy()
    })
  })
})
