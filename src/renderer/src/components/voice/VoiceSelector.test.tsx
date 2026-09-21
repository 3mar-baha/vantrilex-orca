// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { VoiceSelector, type VoiceChoice, type VoiceStore } from './VoiceSelector'

function fakeStore(saved: VoiceChoice = 'male'): VoiceStore & { saved: VoiceChoice[] } {
  const written: VoiceChoice[] = []
  return {
    saved: written,
    getVoice: () => written.at(-1) ?? saved,
    setVoice: async (next: VoiceChoice) => {
      written.push(next)
    }
  }
}

afterEach(() => {
  cleanup()
})

describe('voice selector', () => {
  it('selects the stored voice by default', () => {
    render(<VoiceSelector store={fakeStore('female')} />)
    expect((screen.getByTestId('voice-selector') as HTMLSelectElement).value).toBe('female')
  })

  it('persists voice changes through the store', async () => {
    const store = fakeStore('male')
    const setVoice = vi.spyOn(store, 'setVoice')
    render(<VoiceSelector store={store} />)
    const select = screen.getByTestId('voice-selector') as HTMLSelectElement
    select.value = 'female'
    select.dispatchEvent(new Event('change', { bubbles: true }))
    await vi.waitFor(() => {
      expect(setVoice).toHaveBeenCalledWith('female')
    })
    expect(store.saved).toEqual(['female'])
  })
})
