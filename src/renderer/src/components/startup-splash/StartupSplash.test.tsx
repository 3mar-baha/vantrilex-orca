// @vitest-environment happy-dom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StartupSplash } from './StartupSplash'

afterEach(cleanup)

describe('StartupSplash', () => {
  it('renders canvas and crest, then reveals the emblem phase', () => {
    vi.useFakeTimers()
    try {
      render(<StartupSplash onDone={vi.fn()} durationMs={6000} emblemAtMs={3500} />)
      expect(screen.getByTestId('startup-splash-canvas')).toBeTruthy()
      expect(screen.getByAltText('Vantrilex crest')).toBeTruthy()
      expect(screen.getByTestId('startup-splash-emblem').getAttribute('data-visible')).toBe('false')
      act(() => {
        vi.advanceTimersByTime(3500)
      })
      expect(screen.getByTestId('startup-splash-emblem').getAttribute('data-visible')).toBe('true')
    } finally {
      vi.useRealTimers()
    }
  })

  it('auto-advances once at the duration', () => {
    vi.useFakeTimers()
    try {
      const onDone = vi.fn()
      render(<StartupSplash onDone={onDone} durationMs={6000} emblemAtMs={3500} />)
      vi.advanceTimersByTime(5999)
      expect(onDone).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)
      expect(onDone).toHaveBeenCalledTimes(1)
      vi.advanceTimersByTime(60000)
      expect(onDone).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('skips instantly on click', () => {
    vi.useFakeTimers()
    try {
      const onDone = vi.fn()
      render(<StartupSplash onDone={onDone} durationMs={6000} emblemAtMs={3500} />)
      fireEvent.click(screen.getByTestId('startup-splash'))
      expect(onDone).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('skips instantly on any key press', () => {
    vi.useFakeTimers()
    try {
      const onDone = vi.fn()
      render(<StartupSplash onDone={onDone} durationMs={6000} emblemAtMs={3500} />)
      fireEvent.keyDown(window, { key: 'Enter' })
      expect(onDone).toHaveBeenCalledTimes(1)
      fireEvent.keyDown(window, { key: 'x' })
      expect(onDone).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })
})
