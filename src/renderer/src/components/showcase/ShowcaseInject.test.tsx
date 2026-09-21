// @vitest-environment happy-dom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ShowcaseButton } from './ShowcaseButton'
import { SHOWCASE_GENERATION_PROMPT } from './showcase-prompt'

afterEach(() => {
  cleanup()
})

describe('showcase prompt contract', () => {
  it('names the skill and the design tokens', () => {
    expect(SHOWCASE_GENERATION_PROMPT).toContain('project-showcase-builder')
    expect(SHOWCASE_GENERATION_PROMPT).toContain('#faf9f5')
    expect(SHOWCASE_GENERATION_PROMPT).toContain('#cc785c')
    expect(SHOWCASE_GENERATION_PROMPT).toContain('zero cyber-cyan')
  })
})

describe('showcase shift-click injection', () => {
  it('injects the generation prompt on shift-click', async () => {
    const inject = vi.fn(async () => ({ sessionId: 'session-1' }))
    const generate = vi.fn(async () => ({ path: 'docs/showcase.html' }))
    render(
      <TooltipProvider>
        <ShowcaseButton runner={{ generate }} injector={{ inject }} />
      </TooltipProvider>
    )
    fireEvent.click(screen.getByTestId('showcase-button'), { shiftKey: true })
    await vi.waitFor(() => {
      expect(inject).toHaveBeenCalledWith(SHOWCASE_GENERATION_PROMPT)
    })
    await vi.waitFor(() => {
      expect(screen.getByTestId('showcase-status').textContent).toContain('session-1')
    })
    expect(generate).not.toHaveBeenCalled()
  })

  it('opens the preview on plain click', async () => {
    const inject = vi.fn(async () => ({ sessionId: 'session-1' }))
    const generate = vi.fn(async () => ({ path: 'docs/showcase.html' }))
    render(
      <TooltipProvider>
        <ShowcaseButton runner={{ generate }} injector={{ inject }} />
      </TooltipProvider>
    )
    fireEvent.click(screen.getByTestId('showcase-button'), { shiftKey: false })
    await vi.waitFor(() => {
      expect(generate).toHaveBeenCalledTimes(1)
    })
    expect(inject).not.toHaveBeenCalled()
  })

  it('surfaces injection failures without throwing', async () => {
    const inject = vi.fn(async () => {
      throw new Error('No active runner session')
    })
    render(
      <TooltipProvider>
        <ShowcaseButton runner={{ generate: async () => ({ path: 'x' }) }} injector={{ inject }} />
      </TooltipProvider>
    )
    fireEvent.click(screen.getByTestId('showcase-button'), { shiftKey: true })
    await vi.waitFor(() => {
      expect(screen.getByTestId('showcase-status').textContent).toMatch(/no active runner/i)
    })
  })
})
