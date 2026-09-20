import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'

export type RunnerCli = 'claude' | 'opencode' | 'codex'

export type RunnerTerminalBridge = {
  launch: (request: {
    cli: RunnerCli
    workspace: string
  }) => Promise<{ sessionId: string; pid: number }>
  send: (sessionId: string, input: string) => Promise<{ accepted: boolean }>
  resize: (sessionId: string, cols: number, rows: number) => Promise<{ applied: boolean }>
  terminate: (sessionId: string) => Promise<{ exited: boolean }>
  onExit: (cb: (event: { sessionId: string; code: number }) => void) => () => void
}

export type TerminalShell = {
  open: (el: HTMLElement) => void
  write: (data: string) => void
  onData: (cb: (data: string) => void) => void
  resize?: (cols: number, rows: number) => void
  dispose: () => void
}

type Tab = {
  tabId: number
  sessionId: string
  cli: RunnerCli
  exited: boolean
}

const CLIS: RunnerCli[] = ['claude', 'opencode', 'codex']
const DEFAULT_COLS = 80
const DEFAULT_ROWS = 24

export function TerminalPanel({
  bridge,
  workspace,
  createTerminal,
  maxTabs = 3
}: {
  bridge: RunnerTerminalBridge
  workspace: string
  createTerminal?: () => TerminalShell
  maxTabs?: number
}): React.JSX.Element {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [active, setActive] = useState(0)
  const [ceiling, setCeiling] = useState(false)
  const shells = useRef(new Map<number, TerminalShell>())
  const opened = useRef(new Set<number>())
  const tabSeq = useRef(0)

  useEffect(
    () =>
      bridge.onExit(({ sessionId }) => {
        setTabs((current) =>
          current.map((tab) => (tab.sessionId === sessionId ? { ...tab, exited: true } : tab))
        )
      }),
    [bridge]
  )

  useEffect(
    () => () => {
      for (const shell of shells.current.values()) {
        shell.dispose()
      }
      shells.current.clear()
    },
    []
  )

  async function launch(cli: RunnerCli): Promise<void> {
    if (tabs.length >= maxTabs) {
      setCeiling(true)
      return
    }
    setCeiling(false)
    const launched = await bridge.launch({ cli, workspace })
    const tabId = tabSeq.current++
    const shell = (createTerminal ?? (() => new Terminal()))()
    shells.current.set(tabId, shell)
    shell.onData((data) => {
      void bridge.send(launched.sessionId, data)
    })
    setTabs((current) => [...current, { tabId, sessionId: launched.sessionId, cli, exited: false }])
    setActive(tabs.length)
    await bridge.resize(launched.sessionId, DEFAULT_COLS, DEFAULT_ROWS)
  }

  async function close(tabId: number): Promise<void> {
    const tab = tabs.find((t) => t.tabId === tabId)
    if (!tab) {
      return
    }
    await bridge.terminate(tab.sessionId)
    shells.current.get(tabId)?.dispose()
    shells.current.delete(tabId)
    opened.current.delete(tabId)
    setTabs((current) => current.filter((t) => t.tabId !== tabId))
    setActive((current) => Math.max(0, Math.min(current, tabs.length - 2)))
  }

  function attach(tabId: number): (el: HTMLElement | null) => void {
    return (el) => {
      if (el && !opened.current.has(tabId)) {
        opened.current.add(tabId)
        shells.current.get(tabId)?.open(el)
      }
    }
  }

  return (
    <div data-testid="terminal-panel" className="flex h-full flex-col bg-card text-card-foreground">
      <div className="flex items-center gap-1 border-b p-1">
        {CLIS.map((cli) => (
          <button
            key={cli}
            data-testid={`terminal-new-${cli}`}
            type="button"
            className="rounded border px-2 py-1"
            onClick={() => {
              void launch(cli)
            }}
          >
            + {cli}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 border-b p-1">
        {tabs.map((tab, index) => (
          <div key={tab.tabId} className="flex items-center">
            <button
              data-testid={`terminal-tab-${index}`}
              type="button"
              className="rounded px-2 py-1"
              onClick={() => setActive(index)}
            >
              {tab.cli} · {tab.sessionId}
              {tab.exited ? ' (exited)' : ''}
            </button>
            <button
              data-testid={`terminal-close-${index}`}
              type="button"
              aria-label={`close ${tab.cli}`}
              onClick={() => {
                void close(tab.tabId)
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {ceiling ? (
        <div data-testid="terminal-ceiling-note" className="p-1">
          Tab ceiling reached ({maxTabs} sessions).
        </div>
      ) : null}
      <div className="min-h-0 flex-1">
        {tabs.map((tab, index) => (
          <div
            key={tab.tabId}
            ref={attach(tab.tabId)}
            className="h-full"
            style={{ display: index === active ? 'block' : 'none' }}
          />
        ))}
      </div>
    </div>
  )
}
