import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  dismissFoundryToast,
  pushFoundryToast,
  resetFoundryToastBusForTest,
  subscribeFoundryToasts
} from './foundry-toast-bus'

afterEach(() => {
  resetFoundryToastBusForTest()
  vi.useRealTimers()
})

describe('foundry toast bus', () => {
  it('publishes and dismisses toasts', () => {
    const seen: string[][] = []
    const off = subscribeFoundryToasts((toasts) => seen.push(toasts.map((t) => t.message)))
    const id = pushFoundryToast('Scanning workspace in background...', 'info', 60000)
    expect(seen.at(-1)).toEqual(['Scanning workspace in background...'])
    dismissFoundryToast(id)
    expect(seen.at(-1)).toEqual([])
    off()
  })

  it('auto-dismisses after ttl and caps the stack', () => {
    vi.useFakeTimers()
    try {
      for (let i = 0; i < 7; i += 1) {
        pushFoundryToast(`msg-${i}`, 'info', 60000)
      }
      let current: string[] = []
      const off = subscribeFoundryToasts((toasts) => {
        current = toasts.map((t) => t.message)
      })
      expect(current.length).toBe(5)
      expect(current[0]).toBe('msg-2')
      vi.advanceTimersByTime(60000)
      expect(current).toEqual([])
      off()
    } finally {
      vi.useRealTimers()
    }
  })
})
