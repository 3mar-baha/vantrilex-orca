import { BrowserWindow, ipcMain } from 'electron'
import { statSync } from 'node:fs'
import { registerFoundryIpcHandlers } from '../foundry/foundry-ipc'
import { MobileRelay } from '../mobile-relay/relay-server'
import { registerRelayIpc, relayServiceFrom } from '../mobile-relay/relay-ipc'
import { registerVoiceIpc } from '../voice/voice-ipc'
import { createVoiceStack } from '../voice/voice-service'
import { registerAgentIpc } from '../agent/agent-ipc'
import { briefConclusion } from '../agent/briefing'
import { orchestrateDirective, readWorkspaceState } from '../agent/prompt-orchestrator'
import { TerminalWatcher, type SessionEvent } from '../agent/terminal-watcher'
import { handleRunnerInject } from '../terminal/terminal-handlers'
import { createTerminalManager, registerTerminalIpc } from '../terminal/terminal-ipc'
import { recoverLegacyWorkerTerminalsForRendererStartup } from './legacy-worker-renderer-recovery'
import { logStartupMilestone } from './startup-diagnostics'
import { mainProcessState as state } from './main-process-state'
import { resolveOpenedMarkdownDocuments } from './os-opened-markdown-files'

function isWorkspaceDir(path: string): boolean {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

function broadcastSessionEvent(event: SessionEvent): void {
  const channel = event.type === 'data' ? 'terminal:write' : 'terminal:exit'
  const payload =
    event.type === 'data'
      ? { sessionId: event.id, chunk: event.chunk }
      : { sessionId: event.id, code: event.code }
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, payload)
    }
  }
}

function registerTerminalVoiceAndAgentIpcHandlers(): void {
  const stack = createVoiceStack()
  registerVoiceIpc(ipcMain, stack.service, stack.keyring)
  let ambientArmed = true
  const watcher = new TerminalWatcher((conclusion) => {
    void briefConclusion({ brain: stack.brain, tts: stack.tts }, conclusion, {
      armed: ambientArmed,
      voice: 'male'
    })
  })
  const hookEmit = (event: SessionEvent): void => {
    broadcastSessionEvent(event)
    watcher.observe(event)
  }
  const termDeps = createTerminalManager(hookEmit, isWorkspaceDir)
  registerTerminalIpc(ipcMain, termDeps)
  registerAgentIpc(ipcMain, {
    orchestrate: (directive, workspace) =>
      orchestrateDirective(
        {
          brain: stack.brain,
          readProjectState: readWorkspaceState,
          inject: async (prompt) => handleRunnerInject(termDeps, { prompt }),
          rearm: (sessionId) => watcher.resetSession(sessionId)
        },
        directive,
        workspace
      ),
    setArmed: async (armed) => {
      ambientArmed = armed
    },
    status: () => ({ armed: ambientArmed, pending: watcher.pendingCount() })
  })
}

function registerRelayIpcHandlers(): void {
  const relay = new MobileRelay()
  relay.onApproval((verdict) => {
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) {
        window.webContents.send('relay:approval', verdict)
      }
    }
  })
  registerRelayIpc(ipcMain, relayServiceFrom(relay))
}

export function registerMainProcessIpcHandlers(): void {
  registerFoundryIpcHandlers()
  registerTerminalVoiceAndAgentIpcHandlers()
  registerRelayIpcHandlers()
  ipcMain.handle('app:awaitFirstWindowStartupServices', async () => {
    await Promise.all([
      state.firstWindowStartupServicesReady,
      state.managedWslCliStartupBarrierReady
    ])
  })
  // Why separate from the first-window barrier: host Git needs the shell-PATH
  // generation and the managed WSL CLI registration, not a daemon PTY provider
  // or a hook-server bind. Bundling them made worktree hydration wait on a
  // terminal service it never calls.
  ipcMain.handle('app:awaitGitEnvironmentStartupBarrier', async () => {
    await Promise.all([state.shellPathReady, state.managedWslCliStartupBarrierReady])
  })
  ipcMain.handle('app:prepareTerminalStartupRestoration', async () => {
    await Promise.all([
      state.firstWindowStartupServicesReady,
      state.managedWslCliStartupBarrierReady
    ])
    await state.runtime?.prepareStructuredAgentSessionStartupRestoration()
  })
  ipcMain.handle('app:recoverLegacyWorkerTerminalsForRendererStartup', () =>
    recoverLegacyWorkerTerminalsForRendererStartup({
      firstWindowStartupServicesReady: state.firstWindowStartupServicesReady,
      managedWslCliStartupBarrierReady: state.managedWslCliStartupBarrierReady,
      localPtyProviderStartupReady: state.localPtyProviderStartupReady,
      reconcile: async () => {
        await state.runtime?.refreshRestoredOrchestrationAuthority()
        return state.runtime?.reconcileLegacyWorkerTerminals({ materializeRenderer: true })
      },
      onDeferredRecoveryError: (error) => {
        console.warn('[orchestration] legacy worker provider-ready recovery failed', error)
      }
    })
  )
  // Why: the renderer pulls this once its ui:openSettings listener attaches, so a Settings request queued before mount isn't lost.
  ipcMain.handle('ui:consumePendingOpenSettings', (event) =>
    state.pendingOpenSettings.matches(event.sender.id, { consume: true })
  )
  ipcMain.handle('ui:consumePendingSkillShare', () => state.skillShareDeepLinks.consume())
  // Why: the renderer pulls this once its ui:openMarkdownFiles listener attaches, so a
  // cold-start "Open With" queued before mount still opens. The pull doubles as the proof
  // that the listener is live, which is what lets main start pushing.
  ipcMain.handle('ui:consumePendingMarkdownFileOpens', async () => {
    state.markdownFileOpenListenerReady = true
    const filePaths = state.osOpenedMarkdownFiles.consume()
    try {
      return await resolveOpenedMarkdownDocuments(filePaths)
    } catch (error) {
      // Why restored: the renderer never received these, so a later mount must still get them.
      state.osOpenedMarkdownFiles.restore(filePaths)
      throw error
    }
  })
  ipcMain.handle(
    'app:startupDiagnostic',
    (_event, event: string, details?: Record<string, unknown>) => {
      if (!state.startupDiagnosticsEnabled || !event.startsWith('renderer-')) {
        return
      }
      logStartupMilestone(event, details && typeof details === 'object' ? details : {})
    }
  )
}
