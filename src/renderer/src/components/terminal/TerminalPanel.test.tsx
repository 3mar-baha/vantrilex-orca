// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TerminalPanel, type RunnerTerminalBridge } from './TerminalPanel'

function fakeBridge(): RunnerTerminalBridge & {
  exits: ((e: { sessionId: string; code: number }) => void)[]
} {
  const exits: ((e: { sessionId: string; code: number }) => void)[] = []
  let next = 1
  return {
    exits,
    launch: async () => ({ sessionId: `s-${next++}`, pid: 100 + next }),
    send: async () => ({ accepted: true }),
    resize: async () => ({ applied: true }),
    terminate: async () => ({ exited: true }),
    onExit: (cb) => {
      exits.push(cb)
      return () => {}
    }
  }
}

function fakeFactory(created: { disposed: number; opened: number }) {
  return () => {
    created.opened += 1
    return {
      open: () => {},
      write: () => {},
      onData: () => {},
      resize: () => {},
      dispose: () => {
        created.disposed += 1
      }
    }
  }
}

afterEach(() => {
  cleanup()
})

describe('terminal panel tabs', () => {
  it('launches tabs through the bridge up to the ceiling', async () => {
    const bridge = fakeBridge()
    const created = { disposed: 0, opened: 0 }
    const launch = vi.spyOn(bridge, 'launch')
    render(
      <TerminalPanel
        bridge={bridge}
        workspace="O:/repo"
        createTerminal={fakeFactory(created)}
        maxTabs={3}
      />
    )
    screen.getByTestId('terminal-new-claude').click()
    screen.getByTestId('terminal-new-opencode').click()
    screen.getByTestId('terminal-new-codex').click()
    await vi.waitFor(() => {
      expect(launch).toHaveBeenCalledTimes(3)
      expect(screen.getAllByTestId(/terminal-tab-/).length).toBe(3)
    })
    screen.getByTestId('terminal-new-claude').click()
    expect(launch).toHaveBeenCalledTimes(3)
    await vi.waitFor(() => {
      expect(screen.getByTestId('terminal-ceiling-note')).toBeTruthy()
    })
  })

  it('closes tabs through terminate and disposes terminals on unmount', async () => {
    const bridge = fakeBridge()
    const created = { disposed: 0, opened: 0 }
    const terminate = vi.spyOn(bridge, 'terminate')
    const view = render(
      <TerminalPanel
        bridge={bridge}
        workspace="O:/repo"
        createTerminal={fakeFactory(created)}
        maxTabs={3}
      />
    )
    screen.getByTestId('terminal-new-claude').click()
    await vi.waitFor(() => {
      expect(screen.getAllByTestId(/terminal-tab-/).length).toBe(1)
    })
    screen.getByTestId('terminal-close-0').click()
    await vi.waitFor(() => {
      expect(terminate).toHaveBeenCalledWith('s-1')
    })
    view.unmount()
    expect(created.disposed).toBeGreaterThanOrEqual(1)
  })

  it('marks tabs exited on bridge exit events', async () => {
    const bridge = fakeBridge()
    const created = { disposed: 0, opened: 0 }
    render(
      <TerminalPanel
        bridge={bridge}
        workspace="O:/repo"
        createTerminal={fakeFactory(created)}
        maxTabs={3}
      />
    )
    screen.getByTestId('terminal-new-claude').click()
    await vi.waitFor(() => {
      expect(screen.getAllByTestId(/terminal-tab-/).length).toBe(1)
    })
    bridge.exits.forEach((cb) => cb({ sessionId: 's-1', code: 0 }))
    await vi.waitFor(() => {
      expect(screen.getByTestId('terminal-tab-0').textContent).toMatch(/exited/i)
    })
  })
})
