// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ShowcaseButton } from './ShowcaseButton'

afterEach(() => {
  cleanup()
})

describe('showcase button', () => {
  it('generates and reports the showcase path on click', async () => {
    const generate = vi.fn(async () => ({ path: 'docs/showcase.html' }))
    render(<ShowcaseButton runner={{ generate }} />)
    screen.getByTestId('showcase-button').click()
    await vi.waitFor(() => {
      expect(generate).toHaveBeenCalledTimes(1)
    })
    await vi.waitFor(() => {
      expect(screen.getByTestId('showcase-status').textContent).toContain('docs/showcase.html')
    })
  })

  it('surfaces generation failures as a note instead of throwing', async () => {
    const generate = vi.fn(async () => {
      throw new Error('skill unavailable')
    })
    render(<ShowcaseButton runner={{ generate }} />)
    screen.getByTestId('showcase-button').click()
    await vi.waitFor(() => {
      expect(screen.getByTestId('showcase-status').textContent).toMatch(/unavailable/i)
    })
  })
})
