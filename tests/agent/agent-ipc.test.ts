import { describe, expect, it, vi } from 'vitest'
import {
  AgentValidationError,
  registerAgentIpc,
  type AgentService
} from '../../src/main/agent/agent-ipc'

function captor() {
  const handlers = new Map<string, (event: unknown, ...args: unknown[]) => unknown>()
  return {
    handlers,
    ipc: {
      handle: (channel: string, listener: (event: unknown, ...args: unknown[]) => unknown) => {
        handlers.set(channel, listener)
      }
    }
  }
}

describe('agent ipc', () => {
  it('routes directive, arm, and status', async () => {
    let armed = true
    const service: AgentService = {
      orchestrate: vi.fn(async () => ({ prompt: 'p', sessionId: 'session-1' })),
      setArmed: async (next: boolean) => {
        armed = next
      },
      status: () => ({ armed, pending: 0 })
    }
    const { ipc, handlers } = captor()
    registerAgentIpc(ipc, service)
    expect([...handlers.keys()].sort()).toEqual(['agent:arm', 'agent:directive', 'agent:status'])
    await expect(
      handlers.get('agent:directive')?.({}, { directive: 'go on', workspace: 'O:/repo' })
    ).resolves.toMatchObject({ sessionId: 'session-1' })
    await handlers.get('agent:arm')?.({}, { armed: false })
    expect(armed).toBe(false)
    await expect(handlers.get('agent:status')?.({}, {})).resolves.toMatchObject({ armed: false })
  })

  it('rejects blank directives and malformed arm payloads', async () => {
    const service: AgentService = {
      orchestrate: vi.fn(async () => ({ prompt: 'p', sessionId: 's' })),
      setArmed: async () => {},
      status: () => ({ armed: true, pending: 0 })
    }
    const { handlers } = captor()
    registerAgentIpc({ handle: (c, l) => handlers.set(c, l) }, service)
    await expect(
      handlers.get('agent:directive')?.({}, { directive: '  ', workspace: 'O:/repo' })
    ).rejects.toThrow(AgentValidationError)
    await expect(handlers.get('agent:arm')?.({}, { armed: 'yes' })).rejects.toThrow(
      AgentValidationError
    )
    expect(service.orchestrate).not.toHaveBeenCalled()
  })
})
